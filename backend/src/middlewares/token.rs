use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
};
use axum_extra::extract::cookie::CookieJar;

use crate::{services::token::Token, state::AppState};

const SESSION_COOKIE: &str = "session-token";

/// Ensures that the request contains a valid anonymous
/// session token.
pub struct SessionToken;

impl FromRequestParts<AppState> for SessionToken {
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let jar = CookieJar::from_request_parts(parts, state)
            .await
            .expect("cookie jar should be infallible");

        let token = jar
            .get(SESSION_COOKIE)
            .map(|c| Token::new(c.value().to_owned()))
            .ok_or(StatusCode::UNAUTHORIZED)?;

        state
            .token
            .verify(&token)
            .await
            .map(|_| Self)
            .map_err(|_| StatusCode::UNAUTHORIZED)
    }
}
