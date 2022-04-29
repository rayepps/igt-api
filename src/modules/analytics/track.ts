import _ from 'radash'
import * as t from '../../core/types'
import type { Props } from '@exobase/core'
import { useLogger } from '../../core/hooks/useLogger'
import { useJsonArgs, useService } from '@exobase/hooks'
import { useCors } from '../../core/hooks/useCors'
import { useLambda } from '@exobase/lambda'
import makeMongo, { MongoClient } from '../../core/mongo'
import model from '../../core/model'
import { usePermissionAuthorization } from '@exobase/auth/dist/permission'
import { useTokenAuthentication } from '../../core/hooks/useTokenAuthentication'
import { permissions } from '../../core/auth'
import mappers from '../../core/view/mappers'

interface Args {
  name: string
  tier: t.SponsorTier
}

interface Services {
  mongo: MongoClient
}

type Response = void

async function addSponsor({ args, services }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services
  // TODO: Record event
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useTokenAuthentication(),
  usePermissionAuthorization({
    require: [permissions.sponsor.create]
  }),
  useJsonArgs<Args>(yup => ({
    name: yup.string().required(),
    tier: yup
      .string()
      .oneOf(['featured', 'free', 'partner', 'trial'] as t.SponsorTier[])
      .required()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  addSponsor
)
