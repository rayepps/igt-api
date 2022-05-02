import _ from 'radash'
import * as t from '../../core/types'
import { errors, Props } from '@exobase/core'
import { useLogger } from '../../core/hooks/useLogger'
import { useJsonArgs, useService } from '@exobase/hooks'
import { useCors } from '../../core/hooks/useCors'
import { useLambda } from '@exobase/lambda'
import makeMongo, { MongoClient } from '../../core/mongo'
import { TokenAuth } from '@exobase/auth'
import mappers from '../../core/view/mappers'

interface Args {
  slug: string
}

interface Services {
  mongo: MongoClient
}

type Response = {
  listing: t.ListingView
}

async function findListingBySlug({ args, services, auth }: Props<Args, Services, TokenAuth>): Promise<Response> {
  const { mongo } = services
  const [lerr, listing] = await mongo.findListingBySlug(args.slug)
  if (lerr) throw lerr
  if (!listing) {
    throw errors.notFound({
      details: `Listing with slug(${args.slug}) not found`,
      key: 'igt.err.listings.find-by-slug.not-found'
    })
  }
  return {
    listing: mappers.ListingView.toView(listing)
  }
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useJsonArgs<Args>(yup => ({
    slug: yup.string().required()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  findListingBySlug
)
