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
  password: string
}

interface Services {
  mongo: MongoClient
}

interface Response {
  user: t.UserView
  idToken: string
}

async function loginWithEmailPass({ services, args }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services
  const { email, password } = args

  // Lookup user with email
  const [err, user] = await mongo.findUserByEmail({ email })

  if (err) {
    console.error(err)
    throw errors.badRequest({
      details: 'Provided credentials did not match any users',
      key: 'px.err.auth.login.obscured'
    })
  }

  if (!user) {
    throw errors.badRequest({
      details: 'Provided credentials did not match any users',
      key: 'px.err.auth.login.obscured'
    })
  }

  if (user.disabled) {
    throw errors.badRequest({
      details: 'User account has been disabled',
      key: 'px.err.auth.login.disabled'
    })
  }

  const [hashError, isMatch] = await compareCreds(password, user._passwordHash)

  if (hashError || !isMatch) {
    if (hashError) console.error(hashError)
    throw errors.badRequest({
      details: 'Provided credentials did not match any users',
      key: 'px.err.auth.login.obscured'
    })
  }

  return {
    idToken: createToken({
      sub: user.id,
      type: 'id',
      aud: 'igt.app',
      iss: 'igt.api',
      entity: 'user',
      ttl: dur('7 days'),
      permissions: permissionsForUser(user),
      provider: 'igt',
      extra: {
        email: user.email
      },
      secret: config.tokenSignatureSecret
    }),
    user: mappers.UserView.toView(user)
  }
}

async function compareCreds(providedPassword: string, savedHash: string): Promise<[Error, boolean]> {
  return new Promise(resolve => {
    bcrypt.compare(providedPassword, savedHash, (err, isMatch) => {
      if (err) resolve([err, false])
      else resolve([null, isMatch])
    })
  })
}

// bcrypt.hash('Hashme12!', 10, console.log.bind(console))

// const SALT_ROUNDS = 10
// async function generateHash(password: string): Promise<[Error, string]> {
//   return new Promise((resolve) => {
//       bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
//           if (err) resolve([err, null])
//           else resolve([null, hash])
//       })
//   })
// }

      

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useJsonArgs<Args>(yup => ({
    email: yup.string().email().required(),
    password: yup.string().required()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  loginWithEmailPass
)
