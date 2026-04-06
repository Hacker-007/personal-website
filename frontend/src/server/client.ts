import type { APIContext } from 'astro'
import { API_URL, CF_CLIENT_ID, CF_CLIENT_SECRET } from 'astro:env/server'
import ky from 'ky'

export function createBackendClient(ctx: APIContext) {
  return ky.create({
    prefixUrl: API_URL,
    timeout: 10_000,
    retry: { limit: 2 },
    hooks: {
      beforeRequest: [
        request => {
          request.headers.set('CF-Access-Client-Id', CF_CLIENT_ID)
          request.headers.set('CF-Access-Client-Secret', CF_CLIENT_SECRET)
          if (ctx.locals.abuseToken) {
            request.headers.set('X-Abuse-Token', ctx.locals.abuseToken.token)
          }
        },
      ],
    },
  })
}
