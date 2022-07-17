import _ from 'radash'
import * as t from '../../core/types'
import type { Props } from '@exobase/core'
import { useLogger } from '../../core/hooks/useLogger'
import { useJsonArgs, useService } from '@exobase/hooks'
import { useCors } from '../../core/hooks/useCors'
import { useLambda } from '@exobase/lambda'
import makeMongo, { MongoClient } from '../../core/mongo'
import { useTokenAuthentication } from '../../core/hooks/useTokenAuthentication'
import { usePermissionAuthorization } from '@exobase/auth/dist/permission'
import { permissions } from '../../core/auth'
import mappers from '../../core/view/mappers'

interface Args {
  pageSize?: number
  page?: number
  order?: t.UserOrder
  name?: string
  disabled?: boolean
}

interface Services {
  mongo: MongoClient
}

type Response = Args & {
  users: t.UserView[]
}

async function searchUsers({ args, services }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services
  const users = await mongo.users.search({
    page: args.page ? args.page - 1 : 0,
    pageSize: args.pageSize ?? 25,
    order: args.order ?? 'created-at:asc',
    disabled: args.disabled,
    name: args.name
  })
  return {
    users: users.results.map(mappers.UserView.toView), 
    ...args
  }
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useTokenAuthentication(),
  usePermissionAuthorization({
    require: [permissions.user.read.any]
  }),
  useJsonArgs<Args>(yup => ({
    pageSize: yup.number().integer().min(1).max(100),
    page: yup.number().integer().min(1),
    order: yup.string(), // TODO: Require specific values
    name: yup.string(),
    disabled: yup.boolean()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  searchUsers
)
