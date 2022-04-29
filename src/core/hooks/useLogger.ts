import _ from 'radash'
import { v4 as uuid } from 'uuid'
import { Logtail } from '@logtail/node'
import config from '../config'

declare global {
  var _logtailLogger: Logtail
}

type AnyFunc = (...args: any[]) => any

const getLogger = () => {
  if (!global._logtailLogger) {
    global._logtailLogger = new Logtail(config.logtailToken, {
      batchSize: 2,
      batchInterval: 15
    })
  }
  return global._logtailLogger
}

export const initLogger = () => {
  const logger = getLogger()
  const queue: Record<string, Promise<any>> = {}

  const intercept = (consoleFunc: AnyFunc, logtailFunc: AnyFunc): AnyFunc => {
    if ((consoleFunc as any).__hook === 'log.override') {
      return consoleFunc
    }
    function logOverride(...args: any[]) {
      const id = uuid()
      queue[id] = logtailFunc.apply(logger, args).then(() => delete queue[id])
      consoleFunc.apply(console, args)
    }
    logOverride.__hook = 'log.override'
    return logOverride
  }

  console.log = intercept(console.log, logger.log)
  console.error = intercept(console.error, logger.error)
  console.warn = intercept(console.warn, logger.warn)
  console.debug = intercept(console.debug, logger.debug)

  return {
    pending: () => Object.values(queue)
  }
}

/**
 * By exobase definitions this is a wierd hook because
 * its not a root hook or standard hook. Its used as a
 * root hook but only inits the logger and passes on the
 * next function which is the real root hook.
 */
export const useLogger = () => (func: AnyFunc) => {
  const logger = null // config.env !== 'local' ? initLogger() : null
  return async (...args: any[]) => {
    const [err, result] = await _.try(func)(...args)
    if (logger) {
      const pending = logger.pending()
      if (pending.length > 0) {
        await (Promise as any).allSettled(pending)
      }
    }
    if (err) throw err
    return result
  }
}
