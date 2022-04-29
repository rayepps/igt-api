import type { RedisClientType } from 'redis'

export const createCacheClient = (redis: RedisClientType) => {
  let connected = false;
  const connectFirst = (func: (...args: any[]) => Promise<any>) => async (...args: any[]) => {
    if (!connected) {
      await redis.connect()
      connected = true
    }
    return await func(...args)
  }
  return {
    connect: redis.connect.bind(redis),
    get: connectFirst(async (key: string): Promise<string> => {
      return await redis.get(key)
    }),
    set: connectFirst(async (key: string, value: string, options?: { 
      /**
       * Set the specified expire time, in seconds
       */
      ttl?: number 
    }): Promise<void> => {
      await redis.set(key, value, !options ? undefined : {
        EX: options.ttl
      })
    })
  }
}

export default createCacheClient

export type CacheClient = ReturnType<typeof createCacheClient>
