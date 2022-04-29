import _ from 'radash'
import bcrypt from 'bcryptjs'
import dur from 'durhuman'
import * as t from '../../core/types'
import mappers from '../../core/view/mappers'
import makeMongo, { MongoClient } from '../../core/mongo'
import { useJsonArgs, useService } from '@exobase/hooks'
import { errors, Props } from '@exobase/core'
import { createToken } from '@exobase/auth'
import { useLambda } from '@exobase/lambda'
import { useLogger } from '../../core/hooks/useLogger'
import config from '../../core/config'
import { permissionsForUser } from '../../core/auth'
import { useCors } from '../../core/hooks/useCors'

interface Args {
  email: string
}

interface Services {
  mongo: MongoClient
}

type Response = void

async function resetPassword({ services, args }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services
  const { email } = args
  const [err, user] = await mongo.findUserByEmail({ email })
  if (err) {
    throw errors.unknown({
      details: 'Error while searching for user',
      key: 'igt.err.auth.reset-password.lookup-error'
    })
  }
  if (user.disabled) return
  // TODO: Send reset password email
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useJsonArgs<Args>(yup => ({
    email: yup.string().email().required()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  resetPassword
)
