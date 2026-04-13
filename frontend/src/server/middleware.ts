import type { APIContext } from 'astro'
import { getTokenChallenge, isAlmostExpired, refreshAbuseToken } from './abuse'
import { getCachedToken, setCachedToken } from './tokenCache'
import { checkGlobalRateLimit, checkSessionRateLimit, type RateLimitResult } from './ratelimit'

export type Handler = (ctx: APIContext) => Promise<Response>
type Middleware = (ctx: APIContext, next: Handler) => Promise<Response>

function compose(...middlewares: Middleware[]) {
  return (handler: Handler) =>
    middlewares.reduceRight<Handler>(
      (next, middleware) => ctx => middleware(ctx, next),
      handler
    )
}

const ensureAbuseToken: Middleware = async (ctx, next) => {
  const cachedToken = getCachedToken(ctx)
  if (cachedToken && !isAlmostExpired(cachedToken)) {
    ctx.locals.abuseToken = cachedToken
    return next(ctx)
  }

  if (cachedToken && isAlmostExpired(cachedToken)) {
    const refreshedToken = await refreshAbuseToken(ctx, cachedToken)
    if (refreshedToken) {
      setCachedToken(ctx, refreshedToken)
      ctx.locals.abuseToken = refreshedToken
      return next(ctx)
    }
  }

  const challenge = await getTokenChallenge(ctx)
  if (!challenge) {
    return new Response('failed to get token PoW challenge', { status: 500 })
  }

  return new Response(JSON.stringify(challenge), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'X-Requires-PoW': '1' },
  })
}

function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
    'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
  }
}

const globalRateLimit: Middleware = async (ctx, next) => {
  const result = await checkGlobalRateLimit()
  if (!result.success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: rateLimitHeaders(result),
    })
  }

  return next(ctx)
}

const sessionRateLimit: Middleware = async (ctx, next) => {
  const result = await checkSessionRateLimit(ctx.locals.abuseToken.token)
  if (!result.success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: rateLimitHeaders(result),
    })
  }

  return next(ctx)
}

// Pipeline of composed middlewares for the backend-for-frontend (BFF).
export const bffPipeline = compose(
  globalRateLimit,
  ensureAbuseToken,
  sessionRateLimit
)
