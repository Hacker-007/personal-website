use axum::{Json, Router, body::Bytes, http::StatusCode, response::IntoResponse};
use axum_extra::routing::{RouterExt, TypedPath};
use resp3::{RESPValue, pretty::CommandReader};
use serde::Serialize;

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().typed_post(post_query)
}

#[derive(TypedPath)]
#[typed_path("/v1/redis")]
struct PostQuery;

/// The response for a given Redis query.
///
/// When sent over the wire, the response is encoded as
/// JSON based on the underlying RESP type. See the
/// [specification](https://redis.io/docs/latest/develop/reference/protocol-spec/)
/// for more details.
#[derive(Debug, Serialize)]
struct QueryResponse(RESPValue);

#[tracing::instrument(skip_all)]
async fn post_query(_: PostQuery, req: Bytes) -> impl IntoResponse {
    let command = match CommandReader::new(req).read() {
        Ok(command) => command,
        Err(err) => return Err((StatusCode::BAD_REQUEST, err.to_string())),
    };

    Ok((StatusCode::OK, Json(QueryResponse(command))))
}
