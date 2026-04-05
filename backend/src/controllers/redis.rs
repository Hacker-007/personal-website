use axum::{Router, body::Bytes, extract::State, response::IntoResponse};
use axum_extra::routing::{RouterExt, TypedPath};
use bytes::{BufMut, BytesMut};
use resp3::{
    RESPValue,
    pretty::{CommandReader, RESPWriter},
};
use serde::Serialize;

use crate::{error::AppResult, middlewares::token::SessionToken, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new().typed_post(post_query)
}

#[derive(TypedPath)]
#[typed_path("/v1/redis")]
struct PostQuery;

/// The response for a given Redis query.
///
/// When sent over the wire, the response is encoded as
/// a pretty RESP value, a.k.a a human-readable RESP value.
/// See the [specification](https://redis.io/docs/latest/develop/reference/protocol-spec/)
/// for more details.
#[derive(Debug, Serialize)]
struct QueryResponse(RESPValue);

impl IntoResponse for QueryResponse {
    fn into_response(self) -> axum::response::Response {
        let mut writer = BytesMut::new().writer();
        RESPWriter::new(&mut writer)
            .write(&self.0)
            .expect("I/O operations on Bytes should be infallible");

        let bytes = writer.into_inner();
        bytes.into_response()
    }
}

#[tracing::instrument(skip_all)]
async fn post_query(
    _: PostQuery,
    _: SessionToken,
    mut state: State<AppState>,
    req: Bytes,
) -> AppResult<QueryResponse> {
    let command = CommandReader::new(req).read()?;
    let mut conn = state.redis.get().await?;
    conn.write(command).await?;

    let response = conn
        .read()
        .await?
        .expect("a response should always be provided");

    Ok(QueryResponse(response))
}
