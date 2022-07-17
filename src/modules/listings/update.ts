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
import { TokenAuth } from '@exobase/auth'
import fmt from '../../core/fmt'
import addDays from 'date-fns/addDays'

interface Args {
  id: t.Id<'listing'>
  title: string
  categoryId: t.Id<'category'>
  description: string
  price: number
  images: t.Asset[]
  videoUrl: string | null
  status: t.ListingStatus
}

interface Services {
  mongo: MongoClient
}

interface Response {
  listing: t.ListingView
}

async function updateListing({ args, auth, services }: Props<Args, Services, TokenAuth>): Promise<Response> {
  const { mongo } = services
  const userId = auth.token.sub as t.Id<'user'>

  const listing = await mongo.listings.findByIdForUser({
    id: args.id,
    userId
  })

  if (!listing) {
    throw errors.notFound({
      details: `A listing with the provided id(${args.id}) was not found`,
      key: 'igt.err.listings.update.not-found'
    })
  }

  // Lookup the user and category
  const category = await mongo.categories.find(args.categoryId)

  const newListing: t.Listing = {
    ...listing,
    title: args.title,
    categoryId: args.categoryId,
    description: args.description,
    price: args.price,
    images: args.images,
    video: args.videoUrl ? { url: args.videoUrl } : null,
    status: args.status,
    displayPrice: fmt.price(args.price),
    category,
    expiresAt: addDays(new Date(), 45).getTime()
  }

  await mongo.listings.update(args.id, _.shake({ 
    ...newListing, 
    id: undefined, 
    user: undefined, 
    userId: undefined, 
    createdAt: undefined,
    location: undefined 
  }) as Omit<t.Listing, "id" | "createdAt" | "user" | "userId" | 'location'>)

  return {
    listing: mappers.ListingView.toView(newListing)
  }
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useTokenAuthentication(),
  usePermissionAuthorization({
    require: async ({ auth }: Props<any, any, TokenAuth>) => ([
      permissions.listing.update.owned(auth.token.sub as t.Id<'user'>)
    ])
  }),
  useJsonArgs<Args>(yup => ({
    id: yup.string().matches(/^igt\.listing\.[a-z0-9]+$/).required(),
    title: yup.string().required(),
    categoryId: yup.string().matches(/^igt\.category\.[a-z0-9]+$/).required(),
    description: yup.string().required(),
    price: yup.number().integer().positive().nullable(true),
    images: yup.array().of(yup.object({
      id: yup.string(),
      url: yup.string().url()
    })),
    videoUrl: yup.string().url().nullable(true),
    status: yup.string().oneOf(['available', 'sold'] as t.ListingStatus[]).required()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  updateListing
)
