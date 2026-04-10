use std::time::{Duration, SystemTime};

use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use bytes::{Buf, Bytes};
use hmac::{Hmac, Mac as _, digest::Update};
use rand::RngExt;
use serde::Serialize;
use sha2::Sha256;

use crate::error::TokenError;

pub mod challenge;

type Signer = Hmac<Sha256>;

/// A unique, opaque token used to identify
/// a single anonymous session.
#[derive(Debug, Serialize)]
pub struct Token<T>(T);

impl<T: AsRef<[u8]>> AsRef<[u8]> for Token<T> {
    fn as_ref(&self) -> &[u8] {
        self.0.as_ref()
    }
}

impl<T> Token<T> {
    pub fn new(token: T) -> Self {
        Self(token)
    }
}

/// Generates and verifies unique tokens for
/// validating incoming requests.
///
/// NOTE:
/// These tokens do not provide any authentication
/// or authorization mechanisms. However, they are
/// useful for abuse prevention.
#[derive(Debug, Clone)]
pub struct TokenService {
    secret: Bytes,
    expiration_time: Duration,
}

impl TokenService {
    pub fn new(secret: Bytes, expiration_time: Duration) -> Self {
        Self {
            secret,
            expiration_time,
        }
    }

    /// Issues a new URL-safe base64-encoded token containing
    /// a timestamp, a random nonce, and an HMAC-SHA256 signature.
    pub fn issue(&self) -> Token<String> {
        let timestamp = self.now();
        let mut nonce = [0u8; 16];
        rand::rng().fill(&mut nonce);

        let signature = Signer::new_from_slice(&self.secret)
            .expect("HMAC should take a key of any size")
            .chain(timestamp.to_be_bytes())
            .chain(nonce)
            .finalize()
            .into_bytes();

        // The token is 64 bytes long--16 bytes for the timestamp (u128),
        // 16 bytes for the nonce, and 32 bytes for the HMAC-SHA256 signature.
        let mut token = [0u8; 16 + 16 + 32];
        token[..16].copy_from_slice(&timestamp.to_be_bytes());
        token[16..32].copy_from_slice(&nonce);
        token[32..].copy_from_slice(&signature);
        Token(URL_SAFE_NO_PAD.encode(token))
    }

    /// Returns the Unix timestamp after which `token` will be
    /// considered expired.
    pub fn expiration_time(&self, token: &Token<impl AsRef<[u8]>>) -> Result<u128, TokenError> {
        let mut bytes = URL_SAFE_NO_PAD
            .decode(token)
            .map(Bytes::from)
            .inspect_err(|err| tracing::error!("{err}"))
            .map_err(|_| TokenError::InvalidFormat)?;

        let timestamp = bytes.get_u128();
        Ok(timestamp + self.expiration_time.as_millis())
    }

    /// Verifies that the 64-bit `token` is valid, i.e.
    /// the timestamo is "fresh", the nonce is unique, and
    /// the HMAC signature is valid.
    ///
    /// The structure of the token is diagramed below:
    ///
    ///  -------------------------------------------
    /// | timestamp | nonce |      signature       |
    /// --------------------------------------------
    /// 0          16      32                     64
    pub async fn verify(&self, token: &Token<impl AsRef<[u8]>>) -> Result<(), TokenError> {
        let mut bytes = URL_SAFE_NO_PAD
            .decode(token)
            .map(Bytes::from)
            .inspect_err(|err| tracing::error!("{err}"))
            .map_err(|_| TokenError::InvalidFormat)?;

        if bytes.len() != 64 {
            return Err(TokenError::InvalidFormat);
        }

        let timestamp = bytes.get_u128();
        let nonce = bytes.split_to(16);
        let expected_signature = bytes;
        let actual_signature = Signer::new_from_slice(&self.secret)
            .expect("HMAC should take a key of any size")
            .chain(timestamp.to_be_bytes())
            .chain(&nonce)
            .finalize()
            .into_bytes();

        if expected_signature != &*actual_signature {
            return Err(TokenError::InvalidSignature);
        }

        if self.now() - timestamp > self.expiration_time.as_millis() {
            return Err(TokenError::Expired);
        }

        Ok(())
    }

    /// Returns the current Unix timestamp in milliseconds.
    fn now(&self) -> u128 {
        SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis()
    }
}
