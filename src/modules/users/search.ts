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
  users: t.User[]
}

async function searchUsers({ args, services }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services
  const [err, users] = await mongo.searchUsers({
    page: args.page ?? 1,
    pageSize: args.pageSize ?? 25,
    order: args.order ?? 'created-at:asc',
    disabled: args.disabled,
    name: args.name
  })
  return {
    users, ...args
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
    pageSize: yup.number().integer().positive(),
    page: yup.number().integer().positive(),
    order: yup.string(), // TODO: Require specific values
    name: yup.string(),
    disabled: yup.boolean()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  searchUsers
)
