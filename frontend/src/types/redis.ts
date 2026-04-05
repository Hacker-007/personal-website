import { type } from 'arktype'

export const RedisRequest = type({
  command: 'string',
})

export const RedisResponse = type({
  command: 'string',
  outputLines: 'string[]',
})

export type RedisRequest = typeof RedisRequest.infer
export type RedisResponse = typeof RedisResponse.infer
