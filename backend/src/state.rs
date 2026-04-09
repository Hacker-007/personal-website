use crate::services::{
    redis::RedisPool,
    token::{TokenService, challenge::TokenChallengeService},
};

#[derive(Clone)]
pub struct AppState {
    /// A pool of Unix socket connections to
    /// the Redis server.
    pub redis: RedisPool,
    pub token: TokenService,
    pub challenge: TokenChallengeService,
}
