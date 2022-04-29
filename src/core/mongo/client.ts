import _ from 'radash'
import * as Mongo from 'mongodb'
import * as t from '../types'
import * as mappers from './mappers'
import { addItem, findAll, findItem, findManyItems, updateOne, deleteOne } from './methods'

const mid = (fullId: t.Id<any>) => {
  return new Mongo.ObjectId(fullId.replace(/px\.(.+?)\./, ''))
}

const createMongoClient = (client: Mongo.MongoClient) => {
  const db = client.connect().then(c => c.db('main'))
  return {
    //
    // USERS
    //
    findUserByEmail: findItem({
      db,
      collection: 'users',
      toQuery: ({ email }: { email: string }) => ({
        email
      }),
      toModel: mappers.User.toModel
    }),
    findUserById: findItem({
      db,
      collection: 'users',
      toQuery: (id: t.Id<'user'>) => ({
        _id: mid(id)
      }),
      toModel: mappers.User.toModel
    }),
    addUser: addItem({
      db,
      collection: 'users',
      toDocument: (user: t.User): t.UserDocument => ({
        ...user,
        _id: mid(user.id)
      })
    }),
    searchUsers: findManyItems({
      db,
      collection: 'users',
      toQuery: ({
        disabled,
        name
      }: {
        page: number
        pageSize: number
        order: t.UserOrder
        disabled?: boolean
        name?: string
      }) => ({
        disabled: !disabled ? undefined : disabled,
        fullName: !name
          ? undefined
          : {
              $regex: name,
              $options: 'i'
            }
      }),
      toOptions: (args) => ({
        skip: args.page > 0 ? args.page * args.pageSize : undefined,
        limit: args.pageSize,
        sort: (() => {
          if (!args.order) return undefined
          const [field, dir] = args.order.split(':') as ['logged-in' | 'created-at', 'asc' | 'desc']
          const dirNum = dir === 'asc' ? 1 : -1
          if (field === 'logged-in') {
            return { lastLoggedInAt: dirNum }
          }
          if (field === 'created-at') {
            return { createdAt: dirNum }
          }
        })()
      }),
      toModel: mappers.User.toModel
    }),
    updateUser: updateOne({
      db,
      collection: 'users',
      toQuery: (args: { 
        id: t.Id<'user'>
        patch: Partial<t.User>
      }) => ({
        _id: mid(args.id)
      }),
      toUpdate: args => args.patch
    }),

    //
    // CONTACTS
    //
    addCategory: addItem({
      db,
      collection: 'categories',
      toDocument: (category: t.Category): t.CategoryDocument => ({
        ...category,
        _id: mid(category.id)
      })
    }),
    listCategories: findAll({
      db,
      collection: 'categories',
      toModel: mappers.Category.toModel
    }),
    updateCategory: updateOne({
      db,
      collection: 'categories',
      toQuery: (args: { id: t.Id<'category'>; label: string }) => ({
        _id: mid(args.id)
      }),
      toUpdate: args => ({
        label: args.label
      })
    }),
    findCategory: findItem({
      db,
      collection: 'categories',
      toQuery: (id: t.Id<'category'>) => ({
        _id: mid(id)
      }),
      toModel: mappers.Category.toModel
    }),

    //
    // SPONSORS
    //
    addSponsor: addItem({
      db,
      collection: 'sponsors',
      toDocument: (sponsor: t.Sponsor): t.SponsorDocument => ({
        ...sponsor,
        _id: mid(sponsor.id)
      })
    }),
    listSponsors: findAll({
      db,
      collection: 'sponsors',
      toModel: mappers.Sponsor.toModel
    }),
    updateSponsor: updateOne({
      db,
      collection: 'sponsors',
      toQuery: (args: { 
        id: t.Id<'sponsor'> 
        patch: Partial<Omit<t.Sponsor, 'id'>> 
      }) => ({
        _id: mid(args.id)
      }),
      toUpdate: ({ patch }) => patch
    }),
    findSponsor: findItem({
      db,
      collection: 'sponsors',
      toQuery: (id: t.Id<'sponsor'>) => ({
        _id: mid(id)
      }),
      toModel: mappers.Sponsor.toModel
    }),

    //
    // Listings
    //
    addListing: addItem({
      db,
      collection: 'listings',
      toDocument: (listing: t.Listing): t.ListingDocument => ({
        ...listing,
        _id: mid(listing.id),
        _categoryId: mid(listing.categoryId),
        _userId: mid(listing.userId),
        _text: `${listing.title} ${listing.description}`,
        _location: {
          type: 'Point',
          coordinates: [listing.location.latitude, listing.location.longitude]
        }
      })
    }),
    findListingById: findItem({
      db,
      collection: 'listings',
      toQuery: (id: t.Id<'listing'>) => ({
        _id: mid(id)
      }),
      toModel: mappers.Listing.toModel
    }),
    findListingByIdForUser: findItem({
      db,
      collection: 'listings',
      toQuery: ({ id, userId }: { id: t.Id<'listing'>; userId: t.Id<'user'> }) => ({
        _id: mid(id),
        _userId: mid(userId)
      }),
      toModel: mappers.Listing.toModel
    }),
    searchListings: findManyItems({
      db,
      collection: 'listings',
      toQuery: ({
        near,
        categoryId,
        keywords
      }: {
        page: number
        pageSize: number
        order: t.ListingOrder
        categoryId?: t.Id<'category'>
        near?: t.GeoPoint & { proximity: number }
        keywords?: string
      }) => ({
        _location: !near
          ? undefined
          : {
              $near: {
                $geometry: {
                  type: 'Point',
                  coordinates: [near.latitude, near.longitude]
                },
                $maxDistance: near.proximity
              }
            },
        _categoryId: !categoryId ? undefined : mid(categoryId),
        _text: !keywords
          ? undefined
          : {
              $regex: keywords.split(' ').join('|'),
              $options: 'i'
            }
      }),
      toOptions: args => ({
        skip: args.page > 0 ? args.page * args.pageSize : undefined,
        limit: args.pageSize,
        sort: (() => {
          if (!args.order) return undefined
          const [field, dir] = args.order.split(':') as ['price' | 'updated-at', 'asc' | 'desc']
          const dirNum = dir === 'asc' ? 1 : -1
          if (field === 'price') {
            return { price: dirNum }
          }
          if (field === 'updated-at') {
            return { updatedAt: dirNum }
          }
        })()
      }),
      toModel: mappers.Listing.toModel
    }),
    updateListing: updateOne({
      db,
      collection: 'listings',
      toQuery: ({ id }: { id: t.Id<'listing'>; patch: Omit<t.Listing, 'id' | 'userId' | 'user' | 'createdAt'> }) => ({
        _id: mid(id)
      }),
      toUpdate: ({ patch }) => ({
        ...patch,
        _categoryId: mid(patch.categoryId),
        _text: `${patch.title} ${patch.description}`,
        _location: {
          type: 'Point',
          coordinates: [patch.location.latitude, patch.location.longitude]
        }
      })
    }),
    deleteListing: deleteOne({
      db,
      collection: 'listings',
      toQuery: (id: t.Id<'listing'>) => ({
        _id: mid(id)
      })
    }),

    //
    //  SPONSOR CAMPAIGNS
    //
    updateSponsorCampaigns: updateOne({
      db,
      collection: 'sponsors',
      toQuery: ({ 
        id 
      }: { 
        id: t.Id<'sponsor'>
        campaigns: t.SponsorCampaign[]
      }) => ({
        _id: mid(id)
      }),
      toUpdate: ({ campaigns }) => ({
        campaigns
      })
    }),
  }
}

export default createMongoClient

export type MongoClient = ReturnType<typeof createMongoClient>
