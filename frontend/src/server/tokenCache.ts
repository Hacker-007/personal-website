import type { AbuseToken } from '../types/token'

const cache = new Map<string, AbuseToken>()

export async function getCachedToken(sid: string): Promise<AbuseToken | null> {
  const entry = cache.get(sid)
  if (!entry) {
    return null
  }

  if (Date.now() >= entry.expiresAt) {
    cache.delete(sid)
    return null
  }

  return entry
}

export async function setCachedToken(
  sid: string,
  entry: AbuseToken
): Promise<void> {
  cache.set(sid, entry)
}
