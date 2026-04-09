import { type } from 'arktype'

export const AbuseToken = type({
  token: 'string',
  expiresAt: 'number',
})

export const TokenChallenge = type({
  nonce: 'string',
  timestamp: 'number',
  difficulty: 'number',
  signature: 'string',
})

export const TokenChallengeSolution = type({
  challenge: TokenChallenge,
  solution: 'string',
})

export type AbuseToken = typeof AbuseToken.infer
export type TokenChallenge = typeof TokenChallenge.infer
export type TokenChallengeSolution = typeof TokenChallengeSolution.infer
