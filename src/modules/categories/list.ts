import _ from 'radash'
import * as t from '../../core/types'
import type { Props } from '@exobase/core'
import { useLogger } from '../../core/hooks/useLogger'
import { useService } from '@exobase/hooks'
import { useCors } from '../../core/hooks/useCors'
import { useLambda } from '@exobase/lambda'
import makeMongo, { MongoClient } from '../../core/mongo'
import mappers from '../../core/view/mappers'

interface Args {}

interface Services {
  mongo: MongoClient
}

interface Response {
  categories: t.CategoryView[]
}

async function listCategories({ services }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services
  const categories = await mongo.categories.list()
  return {
    categories: categories.map(mappers.CategoryView.toView)
  }
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useService<Services>({
    mongo: makeMongo()
  }),
  listCategories
)
