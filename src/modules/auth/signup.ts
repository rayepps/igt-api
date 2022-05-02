import _ from 'radash'
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
import { generatePasswordHash, generateToken, permissionsForUser } from '../../core/auth'
import { useCors } from '../../core/hooks/useCors'
import model from '../../core/model'
import makeGeo, { GeoClient } from '../../core/geo'

interface Args {
  email: string
  password: string
  fullName: string
  zip?: string
  cityState?: string
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

  const [hashError, hash] = await generatePasswordHash(args.password)
  if (hashError) {
    console.error(hashError)
    throw errors.badRequest({
      details: 'Error securly saving your password',
      key: 'px.err.auth.signup.hash'
    })
  }

  const [geoerr, location] = args.cityState ? await geo.lookupCityState(args.cityState) : await geo.lookupZip(args.zip)
  if (geoerr) {
    console.error(geoerr)
    throw errors.badRequest({
      details: `Could not find location using ${args.cityState ? args.cityState : args.zip}`,
      key: 'igt.err.auth.signup.no-location'
    })
  }

  console.log({ location, address: args.cityState })

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
    updatedAt: Date.now(),
    _aspRecordId: null
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
    idToken: generateToken(user),
    user: mappers.UserView.toView(user)
  }
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useJsonArgs<Args>(yup => ({
    fullName: yup.string().required('Full name is required'),
    email: yup.string().email('Invalid email format').required('Email is required'),
    password: yup
      .string()
      .required()
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/,
        'Must Contain 8 Characters, One Uppercase, One Lowercase, One Number and One Special Case Character'
      ),
    zip: yup.string().when('cityState', {
      is: (cs: any) => !cs,
      then: schema => schema.required('Must provide zip or city, state').matches(/^\d{5}$/, 'Invalid zipcode format'),
      otherwise: schema => schema
    }),
    cityState: yup.string(),
    terms: yup.boolean().oneOf([true], 'Must accept terms to create an account').required()
  })),
  useService<Services>({
    mongo: makeMongo(),
    geo: makeGeo()
  }),
  signupWithEmailPass
)
