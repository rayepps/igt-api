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

interface Args {
  id: t.Id<'listing'>
  title?: string
  categoryId?: t.Id<'category'>
  description?: string
  price?: number
  images?: t.Asset[]
  videoUrl?: string | null
  location?: t.GeoLocation
  status?: t.ListingStatus
}

interface Services {
  mongo: MongoClient
}

interface Response {
  listing: t.ListingView
}

async function overrideListing({ args, auth, services }: Props<Args, Services, TokenAuth>): Promise<Response> {
  const { mongo } = services

  const [lerr, listing] = await mongo.findListingById(args.id)

  if (!listing) {
    throw errors.notFound({
      details: `A listing with the provided id(${args.id}) was not found`,
      key: 'igt.err.listings.override.not-found'
    })
  }

  // Lookup the user and category
  const [cerr, category] = await mongo.findCategory(args.categoryId)

  const newListing: t.Listing = {
    ...listing,
    title: args.title ? args.title : listing.title,
    categoryId: args.categoryId ? args.categoryId : listing.categoryId,
    description: args.description ? args.description : listing.description,
    price: args.price ? args.price : listing.price,
    images: args.images ? args.images : listing.images,
    video: args.videoUrl ? { url: args.videoUrl } : listing.video,
    location: args.location ? args.location : listing.location,
    status: args.status ? args.status : listing.status,
    displayPrice: args.price ? fmt.price(args.price) : listing.displayPrice,
    category
  }

  const diffPatch = Object.keys(newListing).reduce((acc, key) => {
    const currentValue = listing[key]
    const newValue = newListing[key]
    if (newValue === currentValue) return acc
    return { ...acc, [key]: newValue }
  }, {} as Partial<t.Listing>)

  const [err] = await mongo.updateListing({
    id: args.id,
    patch: _.shake({
      ...diffPatch,
      id: undefined,
      user: undefined,
      userId: undefined,
      createdAt: undefined
    }) as Omit<t.Listing, 'id' | 'createdAt' | 'user' | 'userId'>
  })
  if (err) throw err

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
    require: [permissions.listing.update.any]
  }),
  useJsonArgs<Args>(yup => ({
    id: yup.string().required(),
    title: yup.string(),
    categoryId: yup.string(), // TODO: Require igt.category.{id} format
    description: yup.string(),
    price: yup.number().integer().positive(),
    status: yup.string().oneOf(['available', 'sold'] as t.ListingStatus[]),
    images: yup.array().of(
      yup.object({
        id: yup.string(),
        url: yup.string().url()
      })
    ),
    videoUrl: yup.string().url(),
    location: yup.object({
      longitude: yup.number(),
      latitude: yup.number(),
      zip: yup.number().integer().positive(),
      city: yup.string(),
      state: yup.string()
    })
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  overrideListing
)
