import { type } from 'arktype'
import { TokenChallenge, type TokenChallengeSolution } from '../types/token'

async function solveChallenge(
  challenge: TokenChallenge
): Promise<TokenChallengeSolution | null> {
  return new Promise(resolve => {
    const worker = new Worker(
      new URL('../workers/pow.worker.ts', import.meta.url),
      { type: 'module' }
    )

    worker.onmessage = ({ data }) => {
      worker.terminate()
      resolve(data.solution)
    }

    worker.onerror = () => {
      worker.terminate()
      resolve(null)
    }

    worker.postMessage(challenge)
  })
}

/**
 * Performs a fetch to the backend, automatically solving
 * PoW challenges in a browser worker.
 */
export async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
  })

  if (res.headers.has('X-Requires-PoW')) {
    const body = await res.json()
    const challenge = TokenChallenge(body)
    if (challenge instanceof type.errors) {
      return new Response(
        JSON.stringify({ error: 'invalid challenge parameters' }),
        {
          status: 500,
        }
      )
    }

    const solution = await solveChallenge(challenge)
    if (!solution) {
      return new Response(null, { status: 500 })
    }

    const tokenRes = await fetch('/api/token', {
      method: 'POST',
      body: JSON.stringify({ challenge, solution }),
      credentials: 'include',
    })

    if (!tokenRes.ok) {
      return tokenRes
    }

    return fetch(path, {
      ...init,
      credentials: 'include',
    })
  }

  return res
}
