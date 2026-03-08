use std::path::PathBuf;

use axum::Router;
use clap::Parser;
use dotenvy::dotenv;
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

#[tokio::main(flavor = "multi_thread")]
async fn main() -> AppResult<()> {
    dotenv().ok();
    tracing_subscriber::fmt()
        .compact()
        .without_time()
        .with_file(true)
        .with_line_number(true)
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let args = CLIArguments::parse();
    let app = create_app(args);
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await?;
    info!("🚀 server listening on 127.0.0.1:3000");
    axum::serve(listener, app).await?;
    Ok(())
}

fn create_app(args: CLIArguments) -> Router {
    let redis = RedisPool::new(args.redis_socket, 4);
    Router::new()
        .merge(health::router())
        .merge(redis::router())
        .with_state(AppState { redis })
}
