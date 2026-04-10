import type { APIContext, AstroCookieSetOptions } from 'astro'
import type { AbuseToken } from '../types/token'

const TOKEN_COOKIE = 'Abuse-Token'
const TOKEN_EXP_COOKIE = 'Abuse-Token-Expiration'
const COOKIE_OPTIONS: AstroCookieSetOptions = {
  httpOnly: true,
  secure: !import.meta.env.DEV,
  sameSite: 'strict',
  path: '/',
}

export function getCachedToken(ctx: APIContext): AbuseToken | null {
  const token = ctx.cookies.get(TOKEN_COOKIE)?.value
  const expiration = ctx.cookies.get(TOKEN_EXP_COOKIE)?.value
  if (!token || !expiration) {
    return null
  }

  const expiresAt = Number(expiration)
  if (isNaN(expiresAt) || Date.now() >= expiresAt) {
    return null
  }

  return { token, expiresAt }
}

export function setCachedToken(ctx: APIContext, entry: AbuseToken): void {
  ctx.cookies.set(TOKEN_COOKIE, entry.token, COOKIE_OPTIONS)
  ctx.cookies.set(TOKEN_EXP_COOKIE, String(entry.expiresAt), COOKIE_OPTIONS)
}
