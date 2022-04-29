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
import model from '../../core/model'
import makeGeo, { GeoClient } from '../../core/geo'

interface Args {
  email: string
  password: string
  fullName: string
  zip: number
}

interface Services {
  mongo: MongoClient
  geo: GeoClient
}

interface Response {
  user: t.UserView
  idToken: string
}

async function signupWithEmailPass({ services, args }: Props<Args, Services>): Promise<Response> {
  const { mongo, geo } = services

  // Lookup user with email
  const [lerr, existing] = await mongo.findUserByEmail({ email: args.email })
  if (lerr) {
    console.error(lerr)
    throw errors.unknown({
      details: 'Error checking for email availability',
      key: 'px.err.auth.signup.email-error'
    })
  }
  if (existing) {
    throw errors.badRequest({
      details: `Account with provided email (${args.email}) already exists`,
      key: 'px.err.auth.signup.email-exists'
    })
  }

  const [hashError, hash] = await generateHash(args.password)
  if (hashError) {
    console.error(hashError)
    throw errors.badRequest({
      details: 'Error securly saving your password',
      key: 'px.err.auth.signup.hash'
    })
  }

  const location = await geo.lookupZip(args.zip)

  const user: t.User = {
    id: model.id('user'),
    email: args.email,
    location,
    fullName: args.fullName,
    phone: null,
    role: 'user',
    disabled: false,
    _passwordHash: hash,
    _passwordReset: null,
    lastLoggedInAt: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  const [err] = await mongo.addUser(user)
  if (err) {
    console.error(err)
    throw errors.unknown({
      details: 'Failed to create and save user',
      key: 'igt.err.auth.signup.save-failed'
    })
  }

  return {
    idToken: createToken({
      sub: user.id,
      type: 'id',
      aud: 'px.app',
      iss: 'px.api',
      entity: 'user',
      ttl: dur('7 days'),
      permissions: permissionsForUser(user),
      provider: 'px',
      extra: {
        email: user.email
      },
      secret: config.tokenSignatureSecret
    }),
    user: mappers.UserView.toView(user)
  }
}

const SALT_ROUNDS = 10
const generateHash = async (password: string): Promise<[Error, string]> => {
  return new Promise(resolve => {
    bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
      if (err) resolve([err, null])
      else resolve([null, hash])
    })
  })
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useJsonArgs<Args>(yup => ({
    email: yup.string().email().required(),
    password: yup.string().required(),
    fullName: yup.string().required(),
    zip: yup.number().required()
  })),
  useService<Services>({
    mongo: makeMongo(),
    geo: makeGeo()
  }),
  signupWithEmailPass
)
