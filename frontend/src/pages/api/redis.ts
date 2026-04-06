import type { APIRoute } from 'astro'
import { RedisRequest } from '../../types/redis'
import { type } from 'arktype'
import { bffPipeline, type Handler } from '../../server/middleware'
import { createBackendClient } from '../../server/client'

export const prerender = false

const handler: Handler = async ctx => {
  const body = await ctx.request.json()
  const redisReq = RedisRequest(body)
  if (redisReq instanceof type.errors) {
    return new Response(JSON.stringify({ error: 'invalid Redis request' }), {
      status: 400,
    })
  }

  const client = createBackendClient(ctx)
  const output = await client
    .post('redis', {
      body: redisReq.command,
    })
    .text()

  return new Response(
    JSON.stringify({
      command: redisReq.command,
      outputLines: output.split('\n'),
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

export const POST: APIRoute = async ctx => bffPipeline(handler)(ctx)
