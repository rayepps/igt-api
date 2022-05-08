import _ from 'radash'
import isBefore from 'date-fns/isBefore'
import addMinutes from 'date-fns/addMinutes'
import makeMongo, { MongoClient } from '../../core/mongo'
import { useJsonArgs, useService } from '@exobase/hooks'
import { errors, Props } from '@exobase/core'
import { useLambda } from '@exobase/lambda'
import { useLogger } from '../../core/hooks/useLogger'
import { useCors } from '../../core/hooks/useCors'
import makePostmark, { PostmarkClient } from '../../core/postmark'
import { v4 as uuid } from 'uuid'

interface Args {
  email: string
}

interface Services {
  mongo: MongoClient
  postmark: PostmarkClient
}

type Response = void

async function startPasswordReset({ services, args }: Props<Args, Services>): Promise<Response> {
  const { mongo, postmark } = services

  // Lookup user with email
  const [err, user] = await mongo.findUserByEmail({ email: args.email })

  if (err) {
    console.error(err)
    throw errors.unknown({
      details: 'Something wen\'t wrong. For security reasons, we can\'t say anymore than that. Reach out to info@idahoguntrader.net for help.',
      key: 'px.err.auth.start-reset.unknown'
    })
  }

  if (!user) {
    return
  }

  if (user.disabled) {
    throw errors.badRequest({
      details: 'The account has been disabled. Reach out to info@idahoguntrader.net for help.',
      key: 'px.err.auth.start-reset.disabled'
    })
  }

  // User has already requested a password reset 
  // If it has been less than 5 minutes do nothing
  // If it has been more than 5 minutes send it again
  if (user._passwordReset?.requestedAt > 0) {
    const requested = new Date(user._passwordReset.requestedAt)
    if (isBefore(requested, addMinutes(new Date(), 5))) {
      return
    }
  }

  const code = uuid().replace(/\-/g, '')
  const name = _.first(user.fullName.split(' ').filter(c => !!c && !!c.trim()), user.fullName)
  await mongo.updateUser({
    id: user.id,
    patch: {
      _passwordReset: {
        requestedAt: Date.now(),
        code
      }
    }
  })
  await postmark.sendEmail({
    to: user.email,
    subject: 'Password Reset',
    body: `Hey ${name}, here's that password reset link. Follow it and you'll be prompted for a new password. https://idahoguntrader.net/reset-password?id=${user.id}&code=${code}`
  })

}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useJsonArgs<Args>(yup => ({
    email: yup.string().email().required()
  })),
  useService<Services>({
    mongo: makeMongo(),
    postmark: makePostmark()
  }),
  startPasswordReset
)
