import type { APIContext } from 'astro'
import { getTokenChallenge, isAlmostExpired, refreshAbuseToken } from './abuse'
import { getCachedToken, setCachedToken } from './tokenCache'

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

// Pipeline of composed middlewares for the backend-for-frontend (BFF).
export const bffPipeline = compose(ensureAbuseToken)
