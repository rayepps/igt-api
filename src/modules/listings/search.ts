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
  pageSize?: number
  page?: number
  order?: t.ListingOrder
  keywords?: string
  categoryId?: t.Id<'category'>
  posterId: t.Id<'user'>
  near?: {
    zip: number
    proximity: number 
  }
}

interface Services {
  mongo: MongoClient
  cache: CacheClient
  geo: GeoClient
}

type Response = Args & {
  listings: t.ListingView[]
}

async function searchListings({ args, services }: Props<Args, Services>): Promise<Response> {
  const { mongo, geo } = services
  const [lerr, location] = args.near
    ? await geo.lookupZip(args.near.zip)
    : [null, null]
  if (lerr) {
    throw lerr
  }
  const [err, listings] = await mongo.searchListings({
    near: args.near && {
      ...location,
      proximity: args.near.proximity
    },
    posterId: args.posterId,
    page: args.page ? args.page - 1 : 0,
    pageSize: args.pageSize ?? 25,
    categoryId: args.categoryId,
    order: args.order ?? 'updated-at:asc'
  })
  return {
    ...args,
    listings: listings.map(mappers.ListingView.toView)
  }
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useJsonArgs<Args>(yup => ({
    pageSize: yup.number().integer().min(1).max(100),
    page: yup.number().integer().min(1),
    order: yup.string(), // TODO: Require specific values
    keywords: yup.string(),
    categoryId: yup.string(),
    near: yup.mixed(),
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
