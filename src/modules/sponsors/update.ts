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
  name?: string
  status?: t.SponsorStatus
  tier?: t.SponsorTier
  categoryIds?: t.Id<'category'>[]
}

interface Services {
  mongo: MongoClient
}

type Response = void

async function updateSponsor({ args, services }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services
  const categories = await (async () => {
    if (!args.categoryIds) return
    const [aerr, allCategories] = await mongo.listCategories()
    return allCategories.filter(c => args.categoryIds.includes(c.id))
  })()
  const [serr, sponsor] = await mongo.findSponsor(args.id)
  const patch: Partial<Omit<t.Sponsor, 'id'>>  = {
    ...sponsor,
    name: args.name ?? sponsor.name,
    status: args.status ?? sponsor.status,
    tier: args.tier ?? sponsor.tier,
    categories: categories ?? sponsor.categories
  }
  const [err] = await mongo.updateSponsor({ 
    id: args.id, 
    patch
  })
  if (err) throw err
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
    id: yup.string().required(), // TODO: Match pattern igt.sponsor.{id}
    name: yup.string(),
    status: yup.string().oneOf(['active', 'disabled'] as t.SponsorStatus[]),
    tier: yup.string().oneOf(['featured', 'free', 'partner', 'trial'] as t.SponsorTier[]),
    categoryIds: yup.array().of(yup.string())
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  updateSponsor
)
