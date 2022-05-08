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
import mappers from '../../core/view/mappers'

interface Args {
  sponsorId: t.Id<'sponsor'>
}

interface Services {
  mongo: MongoClient
}

interface Response {
  sponsor: t.SponsorView
}

async function findSponsor({ args, services }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services
  const { sponsorId } = args
  const [err, sponsor] = await mongo.findSponsor(sponsorId)
  if (err) throw err
  return {
    sponsor: mappers.SponsorView.toView(sponsor)
  }
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useTokenAuthentication(),
  usePermissionAuthorization({
    require: [permissions.sponsor.read]
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
  findSponsor
)
