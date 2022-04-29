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
import { TokenAuth } from '@exobase/auth'

interface Args {
  id: t.Id<'listing'>
}

interface Services {
  mongo: MongoClient
}

type Response = void

async function deleteListing({ args, services, auth }: Props<Args, Services, TokenAuth>): Promise<Response> {
  const { mongo } = services
  const userId = auth.token.sub as t.Id<'user'>
  const [lerr, listing] = await mongo.findListingByIdForUser({
    id: args.id,
    userId
  })
  if (lerr) throw lerr
  if (!listing) {
    throw errors.notFound({
      details: `Listing with id(${args.id}) not found`,
      key: 'igt.err.listings.delete.not-found'
    })
  }
  const [err] = await mongo.deleteListing(args.id)
  if (err) throw err
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useTokenAuthentication(),
  usePermissionAuthorization({
    require: async ({ auth }: Props<any, any, TokenAuth>) => ([
      permissions.listing.delete.owned(auth.token.sub as t.Id<'user'>)
    ])
  }),
  useJsonArgs<Args>(yup => ({
    id: yup.string().required()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  deleteListing
)
