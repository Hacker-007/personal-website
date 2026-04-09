use std::time::{Duration, SystemTime};

use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use bytes::Bytes;
use hmac::{Hmac, Mac as _, digest::Update};
use rand::{RngExt, distr::Alphanumeric};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::error::TokenChallengeError;

type Signer = Hmac<Sha256>;

const DIFFICULTY: u8 = 10;

/// A set of parameters that describes a
/// standard PoW challenge: identify a string
/// `s` such that the SHA-256 hash of the
/// `nonce` and `s` result in a binary string
/// with `difficulty` leading zeros.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenChallenge {
    timestamp: u128,
    nonce: String,
    difficulty: u8,
    signature: String,
}

/// Generates and verifies proof-of-work (PoW)
/// challenges. These challenges provide friction
/// against mass-producing abuse tokens.
#[derive(Debug, Clone)]
pub struct TokenChallengeService {
    secret: Bytes,
    leeway: Duration,
}

impl TokenChallengeService {
    pub fn new(secret: Bytes, leeway: Duration) -> Self {
        Self {
            secret,
            leeway,
        }
    }

    /// Issues a new signed challenge containing a random
    /// nonce, a difficulty, a timestamp, and an HMAC-SHA256
    /// signature.
    pub fn issue(&self) -> TokenChallenge {
        let timestamp = self.now();
        let nonce = rand::rng()
            .sample_iter(&Alphanumeric)
            .take(16)
            .map(char::from)
            .collect::<String>();

        let difficulty = DIFFICULTY;
        let signature = Signer::new_from_slice(&self.secret)
            .expect("HMAC should take a key of any size")
            .chain(timestamp.to_be_bytes())
            .chain(nonce.as_bytes())
            .chain([difficulty])
            .finalize()
            .into_bytes();

        TokenChallenge {
            timestamp,
            nonce,
            difficulty,
            signature: URL_SAFE_NO_PAD.encode(signature),
        }
    }

    /// Verifies that given `solution` is valid, i.e.
    /// the challenge parameters haven't been tampered with;
    /// the challenge is "fresh"; and there are `difficulty`
    /// leading zeros in the computed hash.
    pub fn verify(
        &self,
        challenge: TokenChallenge,
        solution: String,
    ) -> Result<(), TokenChallengeError> {
        let expected_signature = URL_SAFE_NO_PAD
            .decode(challenge.signature)
            .map(Bytes::from)
            .map_err(|_| TokenChallengeError::InvalidSignature)?;

        let actual_signature = Signer::new_from_slice(&self.secret)
            .expect("HMAC should take a key of any size")
            .chain(challenge.timestamp.to_be_bytes())
            .chain(challenge.nonce.as_bytes())
            .chain([challenge.difficulty])
            .finalize()
            .into_bytes();

        if expected_signature != &*actual_signature {
            return Err(TokenChallengeError::InvalidSignature);
        }

        if self.now() - challenge.timestamp > self.leeway.as_millis() {
            return Err(TokenChallengeError::Expired);
        }

        let hash = Sha256::digest(format!("{}.{}", challenge.nonce, solution));

        // The total number of leading zero bits can be calculated as follows:
        //
        // `leading zeros = # of zero bytes + leading zeros of first non-zero byte`
        let num_full_zeros = hash.iter().take_while(|&&b| b == 0).count();
        let remaining_zero_bits = hash.get(num_full_zeros).map_or(0, |b| b.leading_zeros());
        let leading_zero_bits = (num_full_zeros as u32) * 8 + remaining_zero_bits;
        if leading_zero_bits < challenge.difficulty as u32 {
            return Err(TokenChallengeError::Incorrect);
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
