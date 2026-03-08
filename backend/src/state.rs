use crate::services::redis::RedisPool;

#[derive(Clone)]
pub struct AppState {
    /// A pool of Unix socket connections to
    /// the Redis server.
    pub redis: RedisPool,
}
