import _ from 'radash'
import * as t from '../../core/types'
import type { Props } from '@exobase/core'
import { useLogger } from '../../core/hooks/useLogger'
import { useJsonArgs, useService } from '@exobase/hooks'
import { useCors } from '../../core/hooks/useCors'
import { useLambda } from '@exobase/lambda'
import makeMongo, { MongoClient } from '../../core/mongo'
import model from '../../core/model'
import { usePermissionAuthorization } from '@exobase/auth/dist/permission'
import { useTokenAuthentication } from '../../core/hooks/useTokenAuthentication'
import { permissions } from '../../core/auth'
import mappers from '../../core/view/mappers'

interface Args {
  label: string
}

interface Services {
  mongo: MongoClient
}

interface Response {
  category: t.CategoryView
}

async function addCategory({ args, services }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services
  const category: t.Category = {
    id: model.id('category'),
    label: args.label
  }
  await mongo.addCategory(category)
  return {
    category: mappers.CategoryView.toView(category)
  }
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useTokenAuthentication(),
  usePermissionAuthorization({
    require: [permissions.category.create]
  }),
  useJsonArgs<Args>(yup => ({
    label: yup.string().required()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  addCategory
)
