import type { APIContext } from 'astro'
import { fetchAbuseToken, isExpired } from './abuse'

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
  let abuseToken = ctx.locals.abuseToken
  if (!abuseToken || isExpired(abuseToken)) {
    abuseToken = await fetchAbuseToken(ctx)
  }

  ctx.locals.abuseToken = abuseToken
  return next(ctx)
}

// Pipeline of composed middlewares for the backend-for-frontend (BFF).
export const bffPipeline = compose(ensureAbuseToken)
