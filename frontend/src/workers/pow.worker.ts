import type { TokenChallenge } from '../types/token'

/**
 * Returns true if `bytes` starts with `difficulty` number of 0s.
 */
function hasLeadingZeroBits(bytes: Uint8Array, difficulty: number): boolean {
  let remainingBits = difficulty
  for (const byte of bytes) {
    if (remainingBits <= 0) {
      return true
    }

    if (remainingBits >= 8) {
      // We require a full byte of zeros, so `byte` must be
      // zero for this to be a valid solution.
      if (byte !== 0) {
        return false
      }

      remainingBits -= 8
    } else {
      // We only need the top `8 - remainingBits` bits
      // to be zero, so we form a mask with these bit
      // positions.
      const mask = 0xff << (8 - remainingBits)
      return (byte & mask) === 0
    }
  }

  return remainingBits <= 0
}

self.onmessage = async (event: MessageEvent<TokenChallenge>) => {
  const { nonce, difficulty } = event.data
  let attempt = 0
  while (true) {
    const candidate = new TextEncoder().encode(`${nonce}.${attempt}`)
    const bytes = await crypto.subtle
      .digest('SHA-256', candidate)
      .then(buffer => new Uint8Array(buffer))

    if (hasLeadingZeroBits(bytes, difficulty)) {
      self.postMessage({ challenge: event.data, solution: `${attempt}` })
      return
    }

    attempt++
  }
}
