import { createClient } from 'redis'
import createCacheClient from './client'
import type { CacheClient } from './client'
import config from '../config'

export type { CacheClient }

export default function makeCacheClient(): CacheClient {
  const client = createCacheClient(
    createClient({
      url: config.redisUrl,
      username: config.redisUsername,
      password: config.redisPassword
    })
  )
  return client
}
