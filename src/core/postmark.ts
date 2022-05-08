import * as postmark from 'postmark'
import config from './config'

const makePostmark = (): PostmarkClient => {
  const client = new postmark.ServerClient(config.postmarkToken)
  return postmarkClient(client)
}

const postmarkClient = (client: postmark.ServerClient) => ({
  sendEmail: async (opts: {
    to: string
    subject: string
    body: string
  }) => {
    await client.sendEmail({
      From: 'info@idahoguntrader.net',
      To: opts.to,
      Subject: opts.subject,
      TextBody: opts.body
    })
  }
})

export type PostmarkClient = ReturnType<typeof postmarkClient>

export default makePostmark