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
  key: string
  images: t.Asset[]
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

  const sponsor = await mongo.sponsors.find(args.sponsorId)
  if (!sponsor) {
    throw errors.badRequest({
      details: `Sponsor with id (${args.sponsorId}) not found`,
      key: 'igt.err.sponsors.add-campaign.not-found'
    })
  }
  
  const existing = sponsor.campaigns.find(c => c.key === args.key)
  if (existing) {
    throw errors.badRequest({
      details: `Campaign with key (${args.key}) already exists`,
      key: 'igt.err.sponsors.add-campaign.duplicate-key'
    })
  }

  const campaigns: t.SponsorCampaign[] = [
    ...sponsor.campaigns, {
    ...args,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }]
  await mongo.sponsors.campaigns.update(sponsor.id, {
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
    key: yup.string().matches(/^[a-z0-9\-]*$/).required(),
    images: yup.array().of(yup.object({
      id: yup.string().required(),
      url: yup.string().url().required()
    })).required(),
    video: yup.object({
      url: yup.string().url()
    }).nullable().default(null),
    title: yup.string().nullable(),
    subtext: yup.string().nullable(),
    cta: yup.string().nullable(),
    url: yup.string().url().nullable()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  addCampaignToSponsor
)
