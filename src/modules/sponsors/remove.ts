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

interface Args {
  sponsorId: t.Id<'sponsor'>
}

interface Services {
  mongo: MongoClient
}

type Response = void

async function removeSponsor({ args, services }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services
  const { sponsorId } = args
  await mongo.sponsors.delete(sponsorId)
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useTokenAuthentication(),
  usePermissionAuthorization({
    require: [permissions.sponsor.delete]
  }),
  useJsonArgs<Args>(yup => ({
    sponsorId: yup
      .string()
      .matches(/^igt\.sponsor\.[a-z0-9]+$/)
      .required()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  removeSponsor
)
