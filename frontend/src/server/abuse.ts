import { type } from 'arktype'
import type { APIContext } from 'astro'
import { createBackendClient } from './client'

const AbuseToken = type({
  token: 'string',
  expiresAt: 'number',
})

export type AbuseToken = typeof AbuseToken.infer

export async function fetchAbuseToken(
  ctx: APIContext
): Promise<AbuseToken | null> {
  const client = createBackendClient(ctx)
  const body = await client.get('token').json()
  const abuseToken = AbuseToken(body)
  return abuseToken instanceof type.errors ? null : abuseToken
}

/**
 * Returns true if `token` is within `buffer` milliseconds to
 * expiration.
 */
export function isExpired(token: AbuseToken, buffer = 30_000): boolean {
  return Date.now() >= token.expiresAt - buffer
}
