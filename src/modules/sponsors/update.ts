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
  id: t.Id<'sponsor'>
  name: string
  status: t.SponsorStatus
  tier: t.SponsorTier
  categoryIds: t.Id<'category'>[]
}

interface Services {
  mongo: MongoClient
}

type Response = void

async function updateSponsor({ args, services }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services
  const categories = await (async () => {
    if (!args.categoryIds) return
    const allCategories = await mongo.categories.list()
    return allCategories.filter(c => args.categoryIds.includes(c.id))
  })()
  const sponsor = await mongo.sponsors.find(args.id)
  const patch: Partial<Omit<t.Sponsor, 'id'>>  = {
    ...sponsor,
    name: args.name ?? sponsor.name,
    status: args.status ?? sponsor.status,
    tier: args.tier ?? sponsor.tier,
    categories: categories ?? sponsor.categories
  }
  await mongo.sponsors.update(args.id, patch)
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
    id: yup.string().matches(/^igt\.sponsor\.[a-z0-9]+$/).required(),
    name: yup.string().required(),
    status: yup.string().oneOf(['active', 'disabled'] as t.SponsorStatus[]).required(),
    tier: yup.string().oneOf(['featured', 'free', 'partner', 'trial'] as t.SponsorTier[]).required(),
    categoryIds: yup.array().of(yup.string().matches(/^igt\.category\.[a-z0-9]+$/)).required()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  updateSponsor
)
