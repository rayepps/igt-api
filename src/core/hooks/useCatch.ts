import _ from 'radash'
import type { Props, ApiFunction } from '@exobase/core'

export async function withTryCatch(func: ApiFunction, errorHandler: ApiFunction, props: Props) {
  const [err, response] = await _.try(func)(props)
  if (err) {
    const [handlerError] = await _.try(errorHandler)({ ...props, error: err } as Props)
    if (handlerError) {
      console.error('useCatch handler threw exception', { error: handlerError })
    }
    throw err
  }
  return response
}

export const useCatch = (errorHandler: ApiFunction) => (func: ApiFunction) => {
  return _.partial(withTryCatch, func, errorHandler)
}
