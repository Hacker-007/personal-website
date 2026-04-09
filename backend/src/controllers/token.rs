use axum::{
    Json, Router,
    extract::State,
    routing::{get, post},
};
use serde::{Deserialize, Serialize};

use crate::{
    error::AppResult,
    middlewares::token::AbuseToken,
    services::token::{Token, challenge::TokenChallenge},
    state::AppState,
};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", post(post_token))
        .route("/challenge", get(get_token_challenge))
        .route("/refresh", post(refresh_token))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TokenRequest {
    challenge: TokenChallenge,
    solution: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct TokenResponse {
    token: Token<String>,
    expires_at: u128,
}

#[tracing::instrument(skip_all)]
async fn get_token_challenge(state: State<AppState>) -> AppResult<Json<TokenChallenge>> {
    Ok(Json(state.challenge.issue()))
}

#[tracing::instrument(skip_all)]
async fn post_token(
    state: State<AppState>,
    Json(request): Json<TokenRequest>,
) -> AppResult<Json<TokenResponse>> {
    state
        .challenge
        .verify(request.challenge, request.solution)?;

    let token = state.token.issue();
    let expires_at = state.token.expiration_time(&token)?;
    Ok(Json(TokenResponse { token, expires_at }))
}

#[tracing::instrument(skip_all)]
async fn refresh_token(_: AbuseToken, state: State<AppState>) -> AppResult<Json<TokenResponse>> {
    let token = state.token.issue();
    let expires_at = state.token.expiration_time(&token)?;
    Ok(Json(TokenResponse { token, expires_at }))
}
