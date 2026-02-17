use axum::Router;
use dotenvy::dotenv;
use tracing::info;

use crate::{controllers::health, error::AppResult, state::AppState};

mod controllers;
mod error;
mod state;

#[tokio::main(flavor = "multi_thread")]
async fn main() -> AppResult<()> {
    dotenv().ok();
    env_logger::init();

    let app = create_app().with_state(AppState);
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await?;
    info!("🚀 server listening on 127.0.0.1:3000");
    axum::serve(listener, app).await?;
    Ok(())
}

pub fn create_app() -> Router<AppState> {
    Router::new().merge(health::router())
}
