import _ from 'radash'
import * as t from '../../core/types'
import type { Props } from '@exobase/core'
import { useLogger } from '../../core/hooks/useLogger'
import { useJsonArgs, useService } from '@exobase/hooks'
import { useCors } from '../../core/hooks/useCors'
import { useLambda } from '@exobase/lambda'
import makeMongo, { MongoClient } from '../../core/mongo'
import { usePermissionAuthorization } from '@exobase/auth/dist/permission'
import { useTokenAuthentication } from '../../core/hooks/useTokenAuthentication'
import { permissions } from '../../core/auth'

interface Args {
  id: t.Id<'category'>
  label: string
}

interface Services {
  mongo: MongoClient
}

type Response = void

async function updateCategory({ args, services }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services
  const [err] = await mongo.updateCategory({ 
    id: args.id, 
    label: args.label 
  })
  if (err) throw err
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useTokenAuthentication(),
  usePermissionAuthorization({
    require: [permissions.category.update]
  }),
  useJsonArgs<Args>(yup => ({
    id: yup.string().required(), // TODO: Match pattern igt.category.{id}
    label: yup.string().required()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  updateCategory
)
