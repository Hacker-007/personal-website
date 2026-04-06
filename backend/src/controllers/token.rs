use axum::{Json, Router, extract::State};
use axum_extra::routing::{RouterExt, TypedPath};
use serde::Serialize;

use crate::{error::AppResult, services::token::Token, state::AppState};

pub fn router() -> Router<AppState> {
    Router::new().typed_get(get_token)
}

#[derive(TypedPath)]
#[typed_path("/v1/token")]
struct GetToken;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct TokenResponse {
    token: Token<String>,
    expires_at: u128,
}

#[tracing::instrument(skip_all)]
async fn get_token(_: GetToken, state: State<AppState>) -> AppResult<Json<TokenResponse>> {
    let token = state.token.issue();
    let expires_at = state.token.expiration_time(&token)?;
    Ok(Json(TokenResponse { token, expires_at }))
}
