use axum::{Router, http::StatusCode, response::IntoResponse, routing::get};

use crate::state::AppState;

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(get_health))
}

#[tracing::instrument(skip_all)]
async fn get_health() -> impl IntoResponse {
    (StatusCode::OK, "OK")
}
