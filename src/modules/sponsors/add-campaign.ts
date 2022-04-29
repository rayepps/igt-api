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
  name: string
  image: null | t.Asset
  video: null | Omit<t.Asset, 'id'>
  title: null | string
  subtext: null | string
  cta: null | string
  url: null | string
}

interface Services {
  mongo: MongoClient
}

interface Response {
  sponsor: t.SponsorView
}

async function addCampaignToSponsor({ args, services }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services

  const [serr, sponsor] = await mongo.findSponsor(args.sponsorId)
  if (serr) {
    console.error(serr)
    throw errors.unknown({
      details: 'Unkonwn issue when looking up sponsor',
      key: 'igt.err.sponsors.add-campaign.lookup-issue'
    })
  }
  if (!sponsor) {
    throw errors.badRequest({
      details: `Sponsor with id (${args.sponsorId}) not found`,
      key: 'igt.err.sponsors.add-campaign.not-found'
    })
  }
  
  const key = _.dashCase(args.name)

  const existing = sponsor.campaigns.find(c => c.key === key)
  if (existing) {
    throw errors.badRequest({
      details: `Campaign with key (${key}) already exists`,
      key: 'igt.err.sponsors.add-campaign.duplicate-key'
    })
  }

  const campaigns: t.SponsorCampaign[] = [
    ...sponsor.campaigns, {
    ...args,
    key,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }]
  await mongo.updateSponsorCampaigns({
    id: sponsor.id,
    campaigns
  })

  return {
    sponsor: mappers.SponsorView.toView({
      ...sponsor,
      campaigns
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
    name: yup.string().required(),
    image: yup.object({
      id: yup.string(),
      url: yup.string().url()
    }).nullable().default(null),
    video: yup.object({
      url: yup.string().url()
    }).nullable().default(null),
    title: yup.string(),
    subtext: yup.string(),
    cta: yup.string(),
    url: yup.string().url()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  addCampaignToSponsor
)
