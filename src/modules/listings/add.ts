import _ from 'radash'
import * as t from '../../core/types'
import type { Props } from '@exobase/core'
import { useLogger } from '../../core/hooks/useLogger'
import { useJsonArgs, useService } from '@exobase/hooks'
import { useCors } from '../../core/hooks/useCors'
import { useLambda } from '@exobase/lambda'
import makeMongo, { MongoClient } from '../../core/mongo'
import model from '../../core/model'
import { usePermissionAuthorization } from '@exobase/auth/dist/permission'
import { useTokenAuthentication } from '../../core/hooks/useTokenAuthentication'
import { permissions } from '../../core/auth'
import mappers from '../../core/view/mappers'
import { TokenAuth } from '@exobase/auth'
import fmt from '../../core/fmt'
import slugger from 'url-slug'
import addDays from 'date-fns/addDays'

interface Args {
  title: string
  categoryId: t.Id<'category'>
  description: string
  price: number
  images: t.Asset[]
  videoUrl: string | null
}

interface Services {
  mongo: MongoClient
}

interface Response {
  listing: t.ListingView
}

async function addListing({ args, auth, services }: Props<Args, Services, TokenAuth>): Promise<Response> {
  const { mongo } = services
  const userId = auth.token.sub as t.Id<'user'>

  // Lookup the user and category
  const user = await mongo.users.find(userId as t.Id<'user'>)
  const category = await mongo.categories.find(args.categoryId)

  const listingId = model.id('listing')

  const listing: t.Listing = {
    id: listingId,
    slug: slugger(`${args.title}-${listingId.replace('igt.listing.', '').substring(0, 5)}`),
    title: args.title,
    status: 'available',
    categoryId: args.categoryId,
    category,
    description: args.description,
    price: args.price,
    displayPrice: fmt.price(args.price),
    images: args.images,
    video: args.videoUrl
      ? {
          url: args.videoUrl
        }
      : null,
    location: user.location,
    userId,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName
    },
    _aspRecordId: null,
    addedAt: Date.now(),
    updatedAt: Date.now(),
    expiresAt: addDays(new Date(), 45).getTime()
  }
  await mongo.listings.add(listing)
  return {
    listing: mappers.ListingView.toView(listing)
  }
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useTokenAuthentication(),
  usePermissionAuthorization({
    require: [permissions.listing.create]
  }),
  useJsonArgs<Args>(yup => ({
    title: yup.string().required(),
    categoryId: yup.string().matches(/^igt\.category\.[a-z0-9]+$/).required(),
    description: yup.string().required(),
    price: yup.number().integer().positive().nullable(),
    images: yup.array().of(yup.object({
      id: yup.string().required(),
      url: yup.string().url().required()
    })).required(),
    videoUrl: yup.string().url().nullable()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  addListing
)
