use axum::{Router, http::StatusCode, response::IntoResponse};
use axum_extra::routing::{RouterExt, TypedPath};

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().typed_get(get_health)
}

#[derive(TypedPath)]
#[typed_path("/v1/healthz")]
struct GetHealth;

#[tracing::instrument(skip_all)]
async fn get_health(_: GetHealth) -> impl IntoResponse {
    (StatusCode::OK, "OK")
}
