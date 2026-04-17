use std::time::Instant;

use axum::{extract::Request, middleware::Next, response::Response};
use tracing::Instrument;
use uuid::Uuid;

/// Instruments each request with a root tracing span and emits one
/// structured log line at request completion. See [Stripe's blog](https://stripe.com/blog/canonical-log-lines)
/// for more information on this pattern.
///
/// ## Span hierarchy
///
/// Any span created inside a handler or service layer will be a child of the
/// `http_request` span, so the full trace tree is correlated by `trace_id`.
///
/// ## Canonical log line
///
/// A single `INFO` or `ERROR` event is emitted when the response headers are
/// ready:
///
/// | field        | type   | notes                        |
/// |--------------|--------|------------------------------|
/// | `trace_id`   | string | UUID v4, unique per request  |
/// | `method`     | string | HTTP verb                    |
/// | `path`       | string | URI path                     |
/// | `query`      | string | URI query string             |
/// | `user_agent` | string |                              |
/// | `status`     | u16    | HTTP status code             |
/// | `latency_ms` | u64    | wall-clock ms                |
pub async fn trace_request(request: Request, next: Next) -> Response {
    let trace_id = Uuid::new_v4();
    let method = request.method().clone();
    let path = request.uri().path().to_owned();
    let query = request.uri().query().unwrap_or("").to_owned();
    let span = tracing::info_span!(
        "http_request",
        trace_id   = %trace_id,
        method     = %method,
        path       = %path,
        status     = tracing::field::Empty,
        latency_ms = tracing::field::Empty,
    );

    let start = Instant::now();
    let response = next.run(request).instrument(span.clone()).await;
    let latency_ms = start.elapsed().as_millis() as u64;
    let status = response.status().as_u16();
    span.record("status", status);
    span.record("latency_ms", latency_ms);
    let _guard = span.enter();
    if response.status().is_server_error() {
        tracing::error!(
            trace_id = %trace_id,
            method   = %method,
            path     = %path,
            query    = %query,
            status,
            latency_ms,
        );
    } else {
        tracing::info!(
            trace_id = %trace_id,
            method   = %method,
            path     = %path,
            query    = %query,
            status,
            latency_ms,
        );
    }

    response
}
