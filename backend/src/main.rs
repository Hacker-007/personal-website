use std::{path::PathBuf, time::Duration};

use axum::{
    Router,
    http::{HeaderValue, Method, header::AUTHORIZATION},
};
use bytes::Bytes;
use clap::Parser;
use dotenvy::dotenv;
use serde::Deserialize;
use tower_http::cors::CorsLayer;
use tracing::info;
use tracing_subscriber::EnvFilter;

use crate::{
    controllers::{health, redis, token},
    error::AppResult,
    services::{
        redis::RedisPool,
        token::{TokenService, challenge::TokenChallengeService},
    },
    state::AppState,
};

mod controllers;
mod error;
mod middlewares;
mod services;
mod state;

#[derive(Parser)]
#[command(version, about, long_about = None)]
struct CLIArguments {
    #[arg(long)]
    redis_socket: PathBuf,
}

#[derive(Debug, Deserialize)]
struct EnvironmentConfig {
    cors_origins: Vec<String>,
    token_secret: Bytes,
}

#[tokio::main(flavor = "multi_thread")]
async fn main() -> AppResult<()> {
    dotenv().ok();
    let env = envy::from_env::<EnvironmentConfig>().expect("environment config should be valid");
    tracing_subscriber::fmt()
        .compact()
        .without_time()
        .with_file(true)
        .with_line_number(true)
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let args = CLIArguments::parse();
    let app = create_app(env, args);
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await?;
    info!("🚀 server listening on 127.0.0.1:3000");
    axum::serve(listener, app).await?;
    Ok(())
}

fn create_app(env: EnvironmentConfig, args: CLIArguments) -> Router {
    let redis = RedisPool::new(args.redis_socket, 4);
    let origins = env
        .cors_origins
        .into_iter()
        .map(|origin| origin.parse::<HeaderValue>())
        .collect::<Result<Vec<_>, _>>()
        .expect("CORS origins should be valid");

    let token = TokenService::new(env.token_secret.clone(), Duration::from_secs(60));
    let challenge = TokenChallengeService::new(env.token_secret, Duration::from_secs(60));
    let api = Router::new()
        .nest("/health", health::router())
        .nest("/redis", redis::router())
        .nest("/token", token::router());

    Router::new()
        .nest("/v1", api)
        .with_state(AppState {
            redis,
            token,
            challenge,
        })
        .layer(
            CorsLayer::new()
                .allow_origin(origins)
                .allow_methods([Method::GET, Method::POST])
                .allow_headers([AUTHORIZATION]),
        )
}
