import type { APIRoute } from 'astro'
import { API_URL } from 'astro:env/server'
import { RedisRequest } from '../../types/redis'
import { type } from 'arktype'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json()
  const redisReq = RedisRequest(body)
  if (redisReq instanceof type.errors) {
    return new Response(JSON.stringify({ error: 'invalid Redis request' }), {
      status: 400,
    })
  }

  const output = await fetch(`${API_URL}/v1/redis`, {
    method: 'POST',
    body: redisReq.command,
  }).then(res => res.text())

  return new Response(
    JSON.stringify({
      command: redisReq.command,
      outputLines: output.split('\n'),
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
