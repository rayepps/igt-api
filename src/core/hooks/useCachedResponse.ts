import _ from 'radash'
import * as uuid from 'uuid'
import type { Props, ApiFunction } from '@exobase/core'
import { CacheClient } from '../cache'

type UnitOfTime = 'second' | 'minute' | 'hour' | 'seconds' | 'minutes' | 'hours'

export type Config<T = any, R = any> = {
  /**
   * Set the specified expire time, in seconds
   */
  key: string
  ttl: `${number} ${UnitOfTime}`
  argsToIdentity: (args: T) => any
  responseToCache: (response: R) => string
  cacheToResponse: (cached: string) => R
}

const configDefaults: Partial<Config> = {
  ttl: '1 hour',
  argsToIdentity: a => a,
  responseToCache: r => JSON.stringify(r),
  cacheToResponse: c => JSON.parse(c)
}

const parseTtl = (ttl:  `${number} ${UnitOfTime}`): number => {
  const [num, unit] = ttl.split(' ') as [string, UnitOfTime]
  const n = parseInt(num)
  switch (unit) {
    case 'hour':
    case 'hours':
      return n * 60 * 60
    case 'minute':
    case 'minutes':
      return n * 60
    case 'second':
    case 'seconds':
      return n
  }
}

const hash = (obj: object) => {
  return uuid.v5(
    JSON.stringify(
      _.mapValues(obj, (value: any) => {
        if (value === null) return 'h.__null__'
        if (value === undefined) return 'h.__undefined__'
        return value
      })
    ),
    uuid.v5.DNS
  )
}

const flatten = (obj: any, prefix: string | null = null) => {
  return Object.keys(obj).reduce((acc, key) => {
    const k = !prefix ? key : `${prefix}.${key}`
    return !obj[key] || typeof obj[key] !== 'object'
      ? { ...acc, [k]: obj[key] }
      : { ...acc, ...flatten(obj[key], k) }
  }, {})
}

export async function withCachedResponse(func: ApiFunction, config: Config, props: Props<any, { cache: CacheClient }>) {
  const skipCacheHeader = props.req.headers['x-skip-cache']
  if (skipCacheHeader === 'yes') {
    console.debug('Skipping cache per X-Skip-Cache: yes')
    return await func(props)
  }
  const key = `${config.key}.${hash(flatten(config.argsToIdentity(props.args)))}`
  const [err, cached] = await _.try(props.services.cache.get)(key)
  if (err) {
    console.error('Cache error on GET. Falling back to function', err)
    return await func(props)
  }
  if (cached) {
    console.debug(`Cache hit for key: ${key}`)
    return config.cacheToResponse(cached)
  }
  console.debug(`Cache miss key: ${key}`)
  const response = await func(props)
  const [setErr] = await _.try(props.services.cache.set)(key, config.responseToCache(response), { ttl: parseTtl(config.ttl) })
  if (setErr) {
    console.error('Cache error on SET. Function result not persisted.', setErr)
  }
  return response
}

export const useCachedResponse =
  <TArgs, TResponse>(config: Partial<Config<TArgs, TResponse>> & { key: string }) =>
  (func: ApiFunction) => {
    return _.partial(withCachedResponse, func, { ...configDefaults, ...config })
  }
