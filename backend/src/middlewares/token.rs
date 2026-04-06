use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
};

use crate::{services::token::Token, state::AppState};

const ABUSE_TOKEN_HEADER: &str = "X-Abuse-Token";

/// Ensures that the request contains a valid anonymous
/// session token.
pub struct AbuseToken;

impl FromRequestParts<AppState> for AbuseToken {
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let token = parts
            .headers
            .get(ABUSE_TOKEN_HEADER)
            .map(|header| Token::new(header))
            .ok_or(StatusCode::UNAUTHORIZED)?;

        state
            .token
            .verify(&token)
            .await
            .map(|_| Self)
            .map_err(|_| StatusCode::UNAUTHORIZED)
    }
}
