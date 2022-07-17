import _ from 'radash'
import bcrypt from 'bcryptjs'
import * as t from '../../core/types'
import mappers from '../../core/view/mappers'
import makeMongo, { MongoClient } from '../../core/mongo'
import { useJsonArgs, useService } from '@exobase/hooks'
import { errors, Props } from '@exobase/core'
import { useLambda } from '@exobase/lambda'
import { useLogger } from '../../core/hooks/useLogger'
import { comparePasswordToHash, generateToken } from '../../core/auth'
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
  const [err, user] = await _.try(mongo.users.findByEmail)(email)

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

  const [hashError, isMatch] = await comparePasswordToHash(password, user._passwordHash)

  if (hashError || !isMatch) {
    if (hashError) console.error(hashError)
    throw errors.badRequest({
      details: 'Provided credentials did not match any users',
      key: 'px.err.auth.login.obscured'
    })
  }

  return {
    idToken: generateToken(user),
    user: mappers.UserView.toView(user)
  }
}

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
