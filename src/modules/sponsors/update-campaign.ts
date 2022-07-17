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
  name?: string
  images?: t.Asset[]
  video?: Omit<t.Asset, 'id'>
  title?: string
  subtext?: string
  cta?: string
  url?: string
}

interface Services {
  mongo: MongoClient
}

interface Response {
  sponsor: t.SponsorView
}

async function updateSponsorCampaign({ args, services }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services

  const sponsor = await mongo.sponsors.find(args.sponsorId)
  if (!sponsor) {
    throw errors.badRequest({
      details: `Sponsor with id (${args.sponsorId}) not found`,
      key: 'igt.err.sponsors.update-campaign.not-found'
    })
  }

  const campaign = sponsor.campaigns.find(c => c.key === args.key)
  if (!campaign) {
    throw errors.badRequest({
      details: `Campaign with key (${args.key}) does not exist`,
      key: 'igt.err.sponsors.update-campaign.not-exists'
    })
  }

  const newCampaign: t.SponsorCampaign = {
    ...campaign,
    name: args.name ?? campaign.name,
    images: args.images ?? campaign.images,
    video: args.video ?? campaign.video,
    title: args.title ?? campaign.title,
    subtext: args.subtext ?? campaign.subtext,
    cta: args.cta ?? campaign.cta,
    url: args.url ?? campaign.url,
    updatedAt: Date.now()
  }
  const newCampaigns = _.replace(sponsor.campaigns, newCampaign, c => c.key === newCampaign.key)
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
    key: yup.string().required(),
    name: yup.string(),
    images: yup.array().of(yup.object({
      id: yup.string(),
      url: yup.string().url()
    })),
    video: yup.object({
      url: yup.string().url()
    }),
    title: yup.string(),
    subtext: yup.string(),
    cta: yup.string(),
    url: yup.string().url()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  updateSponsorCampaign
)
