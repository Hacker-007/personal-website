use std::path::PathBuf;

use axum::{
    Router,
    http::{HeaderValue, Method},
};
use clap::Parser;
use dotenvy::dotenv;
use serde::Deserialize;
use tower_http::cors::CorsLayer;
use tracing::info;
use tracing_subscriber::EnvFilter;

use crate::{
    controllers::{health, redis},
    error::AppResult,
    services::redis::RedisPool,
    state::AppState,
};

mod controllers;
mod error;
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

    Router::new()
        .merge(health::router())
        .merge(redis::router())
        .with_state(AppState { redis })
        .layer(
            CorsLayer::new()
                .allow_origin(origins)
                .allow_methods([Method::GET, Method::POST]),
        )
}
