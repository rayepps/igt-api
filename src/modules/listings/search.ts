import _ from 'radash'
import * as t from '../../core/types'
import type { Props } from '@exobase/core'
import { useLogger } from '../../core/hooks/useLogger'
import { useJsonArgs, useService } from '@exobase/hooks'
import { useCors } from '../../core/hooks/useCors'
import { useLambda } from '@exobase/lambda'
import makeCache, { CacheClient } from '../../core/cache'
import { useCachedResponse } from '../../core/hooks/useCachedResponse'
import makeMongo, { MongoClient } from '../../core/mongo'
import makeGeo, { GeoClient } from '../../core/geo'
import mappers from '../../core/view/mappers'

interface Args {
  size?: number
  page?: number
  order?: t.ListingOrder
  keywords?: string
  category?: string
  posterId: t.Id<'user'>
  near?: {
    zip: string
    proximityInMiles: number 
  }
}

interface Services {
  mongo: MongoClient
  cache: CacheClient
  geo: GeoClient
}

type Response = Args & {
  total: number
  listings: t.ListingView[]
}

async function searchListings({ args, services }: Props<Args, Services>): Promise<Response> {
  const { mongo, geo } = services
  const location = args.near
    ? await geo.lookupZip(args.near.zip)
    : null
  const category = args.category
    ? await mongo.categories.findBySlug(args.category)
    : null
  const listings = await mongo.listings.search({
    near: args.near?.zip && {
      ...location,
      proximity: args.near.proximityInMiles
    },
    posterId: args.posterId,
    page: args.page ? args.page - 1 : 0,
    pageSize: args.size ?? 25,
    categoryId: category?.id,
    order: args.order ?? 'updated-at:asc'
  })
  return {
    ...args,
    total: listings?.count,
    listings: listings?.results.map(mappers.ListingView.toView) ?? []
  }
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useJsonArgs<Args>(yup => ({
    pageSize: yup.number().integer().default(25).max(100),
    page: yup.number().integer().default(1),
    order: yup.string(), // TODO: Require specific values
    keywords: yup.string(),
    category: yup.string(),
    near: yup.object({
      zip: yup.string(), // TODO: Require zip format
      proximityInMiles: yup.number()
    }),
    posterId: yup.string()
  })),
  useService<Services>({
    mongo: makeMongo(),
    cache: makeCache(),
    geo: makeGeo()
  }),
  useCachedResponse<Args, Response>({
    key: 'igt.listings.search',
    ttl: '5 minutes'
  }),
  searchListings
)
