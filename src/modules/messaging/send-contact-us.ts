import _ from 'radash'
import { Props } from '@exobase/core'
import { useLogger } from '../../core/hooks/useLogger'
import { useJsonArgs, useService } from '@exobase/hooks'
import { useCors } from '../../core/hooks/useCors'
import { useLambda } from '@exobase/lambda'
import makePostmark, { PostmarkClient } from '../../core/postmark'

interface Args {
  email: string
  message: string
}

interface Services {
  postmark: PostmarkClient
}

type Response = void

async function sendContactUsMessage({ args, services }: Props<Args, Services>): Promise<Response> {
  const { email, message } = args
  const { postmark } = services
  await postmark.sendToSelf({
    from: email,
    subject: 'IGT Contact',
    body: message
  })
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useJsonArgs<Args>(yup => ({
    email: yup.string().email().required(),
    message: yup.string().required()
  })),
  useService<Services>({
    postmark: makePostmark()
  }),
  sendContactUsMessage
)
