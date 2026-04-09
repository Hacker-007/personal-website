import { randomBytes } from 'node:crypto'
import type { APIContext } from 'astro'

const SESSION_ID_COOKIE = 'sid'

type SessionId = string

export function getOrCreateSession(ctx: APIContext): SessionId {
  const existingSid = ctx.cookies.get(SESSION_ID_COOKIE)?.value
  if (existingSid) {
    return existingSid
  }

  const sid = randomBytes(32).toString('hex')
  ctx.cookies.set(SESSION_ID_COOKIE, sid, {
    httpOnly: true,
    secure: !import.meta.env.DEV,
    sameSite: 'strict',
  })

  return sid
}
