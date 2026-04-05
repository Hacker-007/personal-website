use axum::{Router, extract::State, http::StatusCode};
use axum_extra::{
    extract::cookie::{Cookie, CookieJar, SameSite},
    routing::{RouterExt, TypedPath},
};

use crate::state::AppState;

const SESSION_COOKIE: &str = "session-token";

pub fn router() -> Router<AppState> {
    Router::new().typed_get(get_token)
}

#[derive(TypedPath)]
#[typed_path("/v1/token")]
struct GetToken;

#[tracing::instrument(skip_all)]
async fn get_token(_: GetToken, state: State<AppState>, jar: CookieJar) -> (CookieJar, StatusCode) {
    let token = state.token.issue();
    let cookie = Cookie::build((SESSION_COOKIE, token.into_inner()))
        .http_only(true)
        .secure(true)
        .same_site(SameSite::Strict)
        .build();

    (jar.add(cookie), StatusCode::NO_CONTENT)
}
