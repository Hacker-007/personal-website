use deadpool::managed::{Manager, Metrics, Object, Pool, RecycleResult};
use futures::{SinkExt, StreamExt};
use resp3::{RESPValue, codec::RESPCodec, encoding};
use std::{path::PathBuf, time::Duration};
use tokio::net::UnixStream;
use tokio_util::codec::Framed;

use crate::error::{AppError, AppResult, RedisError};

#[derive(Debug, Clone)]
pub struct RedisPoolManager {
    socket: PathBuf,
}

/// A single Unix domain socket connection to
/// the Redis server.
pub struct RedisConnection {
    stream: Framed<UnixStream, RESPCodec>,
}

impl RedisConnection {
    pub fn new(stream: UnixStream) -> Self {
        Self {
            stream: Framed::new(stream, RESPCodec),
        }
    }

    pub async fn read(&mut self) -> AppResult<Option<RESPValue>> {
        self.stream.next().await.transpose().map_err(Into::into)
    }

    pub async fn write(&mut self, value: RESPValue) -> AppResult<()> {
        self.stream.send(value).await.map_err(Into::into)
    }

    pub async fn ping(&mut self) -> AppResult<()> {
        let ping = encoding::array(vec![encoding::bulk_string("PING")]);
        self.stream.send(ping).await?;
        let value = self
            .stream
            .next()
            .await
            .ok_or_else(|| RedisError::HealthCheck)??;

        if value != encoding::simple_string("PONG") {
            Err(RedisError::HealthCheck.into())
        } else {
            Ok(())
        }
    }
}

impl Manager for RedisPoolManager {
    type Type = RedisConnection;
    type Error = AppError;

    async fn create(&self) -> Result<Self::Type, Self::Error> {
        let stream = UnixStream::connect(&self.socket).await?;
        Ok(RedisConnection::new(stream))
    }

    async fn recycle(&self, conn: &mut Self::Type, _: &Metrics) -> RecycleResult<Self::Error> {
        match tokio::time::timeout(Duration::from_secs(1), conn.ping()).await {
            Ok(Ok(())) => Ok(()),
            Ok(Err(e)) => Err(e.into()),
            Err(_) => Err(AppError::Redis(RedisError::HealthCheck).into()),
        }
    }
}

/// A pool of connections to the Unix domain
/// socket file, used by the Redis server.
#[derive(Clone)]
pub struct RedisPool(Pool<RedisPoolManager>);

impl RedisPool {
    pub fn new(socket: PathBuf, max_size: usize) -> Self {
        Pool::builder(RedisPoolManager { socket })
            .max_size(max_size)
            .build()
            .map(Self)
            .unwrap()
    }

    pub async fn get(&mut self) -> AppResult<Object<RedisPoolManager>> {
        self.0
            .get()
            .await
            .map_err(|_| RedisError::Pool)
            .map_err(Into::into)
    }
}
