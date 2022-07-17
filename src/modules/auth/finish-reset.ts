import _ from 'radash'
import * as t from '../../core/types'
import mappers from '../../core/view/mappers'
import makeMongo, { MongoClient } from '../../core/mongo'
import { useJsonArgs, useService } from '@exobase/hooks'
import { errors, Props } from '@exobase/core'
import { useLambda } from '@exobase/lambda'
import { useLogger } from '../../core/hooks/useLogger'
import { generatePasswordHash, generateToken } from '../../core/auth'
import { useCors } from '../../core/hooks/useCors'

interface Args {
  id: t.Id<'user'>
  code: string
  password: string
}

interface Services {
  mongo: MongoClient
}

interface Response {
  user: t.UserView
  idToken: string
}

async function finishPasswordReset({ services, args }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services
  const { id: userId, code, password } = args

  const [err, user] = await _.try(mongo.users.find)(userId)

  if (err) {
    console.error(err)
    throw errors.unknown({
      details: 'Something wen\'t wrong. For security reasons, we can\'t say anymore than that. Reach out to info@idahoguntrader.net for help.',
      key: 'px.err.auth.finish-reset.unknown'
    })
  }

  if (!user) {
    throw errors.badRequest({
      details: 'The provided id and code do not match',
      key: 'px.err.auth.finish-reset.obscured'
    })
  }

  if (code !== user._passwordReset?.code) {
    throw errors.badRequest({
      details: 'The provided id and code do not match',
      key: 'px.err.auth.finish-reset.obscured'
    })
  }

  const [hashError, hash] = await generatePasswordHash(password)
  if (hashError) {
    console.error(hashError)
    throw errors.badRequest({
      details: 'Error securly saving your new password',
      key: 'px.err.auth.finish-reset.hash'
    })
  }

  await mongo.users.update(user.id, {
    _passwordHash: hash,
    _passwordReset: null
  })

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
    id: yup.string().matches(/^igt\.user\.[a-z0-9]+$/).required(),
    code: yup.string().required(),
    password: yup.string().required()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  finishPasswordReset
)
