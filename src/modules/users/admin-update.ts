import _ from 'radash'
import * as t from '../../core/types'
import { errors, Props } from '@exobase/core'
import { useLogger } from '../../core/hooks/useLogger'
import { useJsonArgs, useService } from '@exobase/hooks'
import { useCors } from '../../core/hooks/useCors'
import { useLambda } from '@exobase/lambda'
import makeMongo, { MongoClient } from '../../core/mongo'
import { usePermissionAuthorization } from '@exobase/auth/dist/permission'
import { useTokenAuthentication } from '../../core/hooks/useTokenAuthentication'
import { permissions } from '../../core/auth'
import mappers from '../../core/view/mappers'
import { TokenAuth } from '@exobase/auth'

interface Args {
  id: t.Id<'user'>
  email?: string
  phone?: string
  fullName?: string
  role?: t.UserRole
  disabled?: boolean
}

interface Services {
  mongo: MongoClient
}

interface Response {
  user: t.UserView
}

async function adminUpdateUser({ args, services }: Props<Args, Services, TokenAuth>): Promise<Response> {
  const { mongo } = services

  const user = await mongo.users.find(args.id)
  if (!user) {
    throw errors.notFound({
      details: `A user with the provided id(${args.id}) was not found`,
      key: 'igt.err.users.admin-update.not-found'
    })
  }

  const patch: Partial<t.User> = {
    email: args.email ?? user.email,
    phone: args.phone ?? user.phone,
    fullName: args.fullName ?? user.fullName,
    role: args.role ?? user.role,
    disabled: args.disabled ?? user.disabled
  }

  await mongo.users.update(args.id, patch)

  return {
    user: mappers.UserView.toView({
      ...user,
      ...patch
    })
  }
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useTokenAuthentication(),
  usePermissionAuthorization({
    require: [permissions.user.update.any]
  }),
  useJsonArgs<Args>(yup => ({
    id: yup.string().required(),
    email: yup.string().email(),
    phone: yup.string(),
    fullName: yup.string(),
    role: yup.string().oneOf(['admin', 'admin-observer', 'user'] as t.UserRole[]),
    disabled: yup.boolean()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  adminUpdateUser
)
