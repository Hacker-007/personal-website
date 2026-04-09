use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};
use thiserror::Error;

pub type AppResult<T> = Result<T, AppError>;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("[io] {0}")]
    IO(#[from] std::io::Error),
    #[error("[redis] {0}")]
    Redis(#[from] RedisError),
    #[error("[token] {0}")]
    Token(#[from] TokenError),
    #[error("[challenge] {0}")]
    TokenChallenge(#[from] TokenChallengeError),
}

#[derive(Debug, Error)]
pub enum TokenError {
    #[error("invalid token format found")]
    InvalidFormat,
    #[error("the token is expired")]
    Expired,
    #[error("signature of token does not match")]
    InvalidSignature,
}

#[derive(Debug, Error)]
pub enum TokenChallengeError {
    #[error("the token challenge is expired")]
    Expired,
    #[error("invalid token challenge signature found")]
    InvalidSignature,
    #[error("the provided solution is incorrect")]
    Incorrect,
}

#[derive(Debug, Error)]
pub enum RedisError {
    #[error("health check timed out")]
    HealthCheck,
    #[error("an unknown error occurred within the pool")]
    Pool,
    #[error(transparent)]
    Resp(#[from] resp3::error::RESPError),
    #[error(transparent)]
    CommandRead(#[from] resp3::pretty::CommandReadError),
}

impl From<resp3::error::RESPError> for AppError {
    fn from(error: resp3::error::RESPError) -> Self {
        AppError::Redis(RedisError::Resp(error))
    }
}

impl From<resp3::pretty::CommandReadError> for AppError {
    fn from(error: resp3::pretty::CommandReadError) -> Self {
        AppError::Redis(RedisError::CommandRead(error))
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status_code = match self {
            AppError::IO(_)
            | AppError::Redis(RedisError::HealthCheck)
            | AppError::Redis(RedisError::Pool)
            | AppError::Redis(RedisError::Resp(_))
            | AppError::Redis(RedisError::CommandRead(_)) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::Token(TokenError::InvalidFormat)
            | AppError::Token(TokenError::Expired)
            | AppError::Token(TokenError::InvalidSignature)
            | AppError::TokenChallenge(TokenChallengeError::Expired)
            | AppError::TokenChallenge(TokenChallengeError::InvalidSignature)
            | AppError::TokenChallenge(TokenChallengeError::Incorrect) => StatusCode::BAD_REQUEST,
        };

        (status_code, self.to_string()).into_response()
    }
}
