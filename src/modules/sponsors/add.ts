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
}

interface Services {
  mongo: MongoClient
}

interface Response {
  sponsor: t.SponsorView
}

async function addSponsor({ args, services }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services
  const sponsor: t.Sponsor = {
    id: model.id('sponsor'),
    status: 'disabled',
    name: args.name,
    tier: 'trial',
    categories: [],
    campaigns: [],
    deleted: false,
    deletedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  await mongo.sponsors.add(sponsor)
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
    require: [permissions.sponsor.create]
  }),
  useJsonArgs<Args>(yup => ({
    name: yup.string().required()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  addSponsor
)
