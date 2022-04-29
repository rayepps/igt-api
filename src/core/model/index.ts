import crypto from 'crypto'
import { Id, Model } from './types'

const id = <TModel extends Model>(model: TModel): Id<TModel> => {
  const rand = crypto.randomBytes(12).toString('hex')
  return `igt.${model}.${rand}`
}

export default {
  id
}