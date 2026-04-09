import type { APIContext } from 'astro'
import { createBackendClient } from './client'
import { type } from 'arktype'
import { TokenChallenge, AbuseToken } from '../types/token'

export async function getTokenChallenge(
  ctx: APIContext
): Promise<TokenChallenge | null> {
  const client = createBackendClient(ctx)
  const body = await client.get('token/challenge').json()
  const challenge = TokenChallenge(body)
  return challenge instanceof type.errors ? null : challenge
}

export async function fetchAbuseToken(
  ctx: APIContext,
  challenge: TokenChallenge,
  solution: string
): Promise<AbuseToken | null> {
  const client = createBackendClient(ctx)
  const body = await client
    .post('token', {
      json: {
        challenge,
        solution,
      },
    })
    .json()

  const abuseToken = AbuseToken(body)
  return abuseToken instanceof type.errors ? null : abuseToken
}

export async function refreshAbuseToken(
  ctx: APIContext,
  existingToken: AbuseToken
): Promise<AbuseToken | null> {
  const client = createBackendClient(ctx)
  const body = await client
    .post('token/refresh', {
      json: { token: existingToken },
    })
    .json()

  const abuseToken = AbuseToken(body)
  return abuseToken instanceof type.errors ? null : abuseToken
}

/**
 * Returns true if `token` is within `buffer` milliseconds to
 * expiration.
 */
export function isAlmostExpired(token: AbuseToken, buffer = 30_000): boolean {
  return Date.now() >= token.expiresAt - buffer
}
