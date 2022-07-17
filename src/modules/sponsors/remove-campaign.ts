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
import mappers from '../../core/view/mappers'

interface Args {
  sponsorId: t.Id<'sponsor'>
  key: string
}

interface Services {
  mongo: MongoClient
}

interface Response {
  sponsor: t.SponsorView
}

async function removeSponsorCampaign({ args, services }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services

  const sponsor = await mongo.sponsors.find(args.sponsorId)
  if (!sponsor) {
    throw errors.badRequest({
      details: `Sponsor with id (${args.sponsorId}) not found`,
      key: 'igt.err.sponsors.remove-campaign.not-found'
    })
  }

  const newCampaigns = sponsor.campaigns.filter(c => c.key !== args.key)
  await mongo.sponsors.campaigns.update(sponsor.id, {
    campaigns: newCampaigns
  })

  return {
    sponsor: mappers.SponsorView.toView({
      ...sponsor,
      campaigns: newCampaigns
    })
  }
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useTokenAuthentication(),
  usePermissionAuthorization({
    require: [permissions.sponsor.update]
  }),
  useJsonArgs<Args>(yup => ({
    sponsorId: yup.string().required(),
    key: yup.string().required()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  removeSponsorCampaign
)
