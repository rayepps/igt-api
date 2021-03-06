import _ from 'radash'
import * as t from '../../core/types'
import type { Props } from '@exobase/core'
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

async function adminDeleteListing({ args, services }: Props<Args, Services, TokenAuth>): Promise<Response> {
  const { mongo } = services
  await mongo.listings.delete(args.id)
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useTokenAuthentication(),
  usePermissionAuthorization({
    require: [permissions.listing.delete.any]
  }),
  useJsonArgs<Args>(yup => ({
    id: yup.string().required()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  adminDeleteListing
)
