import type { APIRoute } from 'astro'
import { RedisRequest } from '../../types/redis'
import { type } from 'arktype'
import { bffPipeline, type Handler, type ErrorMapper } from '../../server/middleware'
import { createBackendClient } from '../../server/client'

export const prerender = false

function errorResponse(message: string) {
  return Response.json({ outputLines: [`(error) ERR ${message}`] })
}

const onError: ErrorMapper = error => {
  if (error instanceof Response && error.status === 429) {
    const retryAfter = error.headers.get('Retry-After')
    return errorResponse(
      retryAfter
        ? `rate limited; please retry after ${retryAfter} seconds`
        : 'rate limited; please try again later'
    )
  }
  return errorResponse('something went wrong; please try again later')
}

const handler: Handler = async ctx => {
  const body = await ctx.request.json()
  const redisReq = RedisRequest(body)
  if (redisReq instanceof type.errors) {
    return errorResponse('invalid request')
  }

  const client = createBackendClient(ctx)
  const output = await client.post('redis', { body: redisReq.command }).text()
  return Response.json({ outputLines: output.split('\n') })
}

export const POST: APIRoute = ctx => bffPipeline(handler, onError)(ctx)
