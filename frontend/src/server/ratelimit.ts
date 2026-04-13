import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis/cloudflare'
import {
  UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN,
  GLOBAL_MINUTE_RATE_LIMIT,
  SESSION_MINUTE_RATE_LIMIT,
} from 'astro:env/server'

let globalLimiter: Ratelimit
let sessionLimiter: Ratelimit

function getLimiters() {
  if (!globalLimiter || !sessionLimiter) {
    const redis = new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    })

    globalLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(GLOBAL_MINUTE_RATE_LIMIT, '1 m'),
      prefix: 'rl:global',
    })

    sessionLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(SESSION_MINUTE_RATE_LIMIT, '1 m'),
      prefix: 'rl:session',
    })
  }

  return { globalLimiter, sessionLimiter }
}

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export async function checkGlobalRateLimit(): Promise<RateLimitResult> {
  const { globalLimiter } = getLimiters()
  const { success, limit, remaining, reset } =
    await globalLimiter.limit('global')
  return { success, limit, remaining, reset }
}

export async function checkSessionRateLimit(
  token: string
): Promise<RateLimitResult> {
  const { sessionLimiter } = getLimiters()
  const { success, limit, remaining, reset } = await sessionLimiter.limit(token)
  return { success, limit, remaining, reset }
}
