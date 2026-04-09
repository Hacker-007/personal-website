import type { APIRoute } from 'astro'
import { type } from 'arktype'
import { fetchAbuseToken } from '../../server/abuse'
import { getOrCreateSession } from '../../server/session'
import { setCachedToken } from '../../server/tokenCache'
import { TokenChallengeSolution } from '../../types/token'

export const prerender = false

export const POST: APIRoute = async ctx => {
  const body = await ctx.request.json()
  const submissionRequest = TokenChallengeSolution(body)
  if (submissionRequest instanceof type.errors) {
    return new Response(null, { status: 400 })
  }

  const { challenge, solution } = submissionRequest
  const sid = getOrCreateSession(ctx)
  const token = await fetchAbuseToken(ctx, challenge, solution)
  if (!token) {
    return new Response(null, { status: 500 })
  }

  await setCachedToken(sid, token)
  return new Response(null, { status: 200 })
}
