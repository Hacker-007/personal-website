use std::path::PathBuf;

#[derive(Clone)]
pub struct AppState {
    /// The path to the Unix domain socket
    /// file the Redis server is listening
    /// on.
    pub redis_socket: PathBuf,
}
