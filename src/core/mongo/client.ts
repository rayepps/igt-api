import _ from 'radash'
import * as Mongo from 'mongodb'
import * as t from '../types'
import * as mappers from './mappers'
import { addItem, findAll, findItem, findManyItems, updateOne, deleteOne } from './methods'

const mid = (fullId: t.Id<any>) => {
  return new Mongo.ObjectId(fullId.replace(/igt\.(.+?)\./, ''))
}

const createMongoClient = (client: Mongo.MongoClient) => {
  const db = client.connect().then(c => c.db('main'))
  return {
    //
    // USERS
    //
    users: {
      findByEmail: findItem({
        db,
        collection: 'users',
        toQuery: (email: string) => ({
          email
        }),
        toModel: mappers.User.toModel
      }),
      find: findItem({
        db,
        collection: 'users',
        toQuery: (id: t.Id<'user'>) => ({
          _id: mid(id)
        }),
        toModel: mappers.User.toModel
      }),
      findByLegacyId: findItem({
        db,
        collection: 'users',
        toQuery: (aspRecordId: string | number) => ({
          _aspRecordId: aspRecordId as number
        }),
        toModel: mappers.User.toModel
      }),
      add: addItem({
        db,
        collection: 'users',
        toDocument: (user: t.User): t.UserDocument => ({
          ...user,
          _id: mid(user.id)
        })
      }),
      search: findManyItems({
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
        }) =>
          _.shake({
            disabled: !disabled ? undefined : disabled,
            fullName: !name
              ? undefined
              : {
                  $regex: name,
                  $options: 'i'
                }
          }),
        toOptions: args => ({
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
      update: updateOne({
        db,
        collection: 'users',
        toQuery: (id: t.Id<'user'>) => ({
          _id: mid(id)
        }),
        toUpdate: (patch: Partial<t.User>) => ({
          $set: patch
        })
      })
    },

    //
    // CATEGORIES
    //
    categories: {
      add: addItem({
        db,
        collection: 'categories',
        toDocument: (category: t.Category): t.CategoryDocument => ({
          ...category,
          _id: mid(category.id)
        })
      }),
      list: findAll({
        db,
        collection: 'categories',
        toModel: mappers.Category.toModel
      }),
      update: updateOne({
        db,
        collection: 'categories',
        toQuery: (id: t.Id<'category'>) => ({
          _id: mid(id)
        }),
        toUpdate: (patch: { label: string; slug: string }) => ({
          $set: patch
        })
      }),
      find: findItem({
        db,
        collection: 'categories',
        toQuery: (id: t.Id<'category'>) => ({
          _id: mid(id)
        }),
        toModel: mappers.Category.toModel
      }),
      findBySlug: findItem({
        db,
        collection: 'categories',
        toQuery: (slug: string) => ({
          slug
        }),
        toModel: mappers.Category.toModel
      })
    },

    //
    // SPONSORS
    //
    sponsors: {
      add: addItem({
        db,
        collection: 'sponsors',
        toDocument: (sponsor: t.Sponsor): t.SponsorDocument => ({
          ...sponsor,
          _id: mid(sponsor.id)
        })
      }),
      list: findAll({
        db,
        collection: 'sponsors',
        query: {
          deleted: { $ne: true }
        },
        toModel: mappers.Sponsor.toModel
      }),
      update: updateOne({
        db,
        collection: 'sponsors',
        toQuery: (id: t.Id<'sponsor'>) => ({
          _id: mid(id)
        }),
        toUpdate: (patch: Partial<Omit<t.Sponsor, 'id'>>) => ({
          $set: patch
        })
      }),
      find: findItem({
        db,
        collection: 'sponsors',
        toQuery: (id: t.Id<'sponsor'>) => ({
          _id: mid(id)
        }),
        toModel: mappers.Sponsor.toModel
      }),
      delete: updateOne({
        db,
        collection: 'sponsors',
        toQuery: (id: t.Id<'sponsor'>) => ({
          _id: mid(id)
        }),
        toUpdate: () => ({
          $set: { deleted: true, deletedAt: Date.now() }
        })
      }) as (id: t.Id<'sponsor'>) => Promise<void>,

      //
      //  SPONSOR CAMPAIGNS
      //
      campaigns: {
        update: updateOne({
          db,
          collection: 'sponsors',
          toQuery: (id: t.Id<'sponsor'>) => ({
            _id: mid(id)
          }),
          toUpdate: ({ campaigns }: { campaigns: t.SponsorCampaign[] }) => ({
            $set: {
              campaigns
            }
          })
        })
      }
    },

    //
    // Listings
    //
    listings: {
      add: addItem({
        db,
        collection: 'listings',
        toDocument: (listing: t.Listing): t.ListingDocument => ({
          ...listing,
          _id: mid(listing.id),
          _categoryId: mid(listing.categoryId),
          _userId: mid(listing.userId),
          _text: `${listing.title} ${listing.description}`,
          _location: listing.location
            ? {
                type: 'Point',
                coordinates: [listing.location.longitude, listing.location.latitude]
              }
            : null
        })
      }),
      find: findItem({
        db,
        collection: 'listings',
        toQuery: (id: t.Id<'listing'>) => ({
          _id: mid(id)
        }),
        toModel: mappers.Listing.toModel
      }),
      findByLegacyId: findItem({
        db,
        collection: 'listings',
        toQuery: (aspRecordId: number) => ({
          _aspRecordId: aspRecordId
        }),
        toModel: mappers.Listing.toModel
      }),
      findBySlug: findItem({
        db,
        collection: 'listings',
        toQuery: (slug: string) => ({
          slug
        }),
        toModel: mappers.Listing.toModel
      }),
      findByIdForUser: findItem({
        db,
        collection: 'listings',
        toQuery: ({ id, userId }: { id: t.Id<'listing'>; userId: t.Id<'user'> }) => ({
          _id: mid(id),
          _userId: mid(userId)
        }),
        toModel: mappers.Listing.toModel
      }),
      search: findManyItems({
        db,
        collection: 'listings',
        count: true,
        toQuery: ({
          near,
          categoryId,
          keywords,
          posterId
        }: {
          page: number
          pageSize: number
          order: t.ListingOrder
          posterId?: t.Id<'user'>
          categoryId?: t.Id<'category'>
          near?: t.GeoPoint & { proximity: number }
          keywords?: string
        }) =>
          _.shake({
            _location: !near
              ? undefined
              : {
                  $near: {
                    $geometry: {
                      type: 'Point',
                      coordinates: [near.longitude, near.latitude]
                    },
                    $maxDistance: near.proximity
                  }
                },
            _userId: !posterId ? undefined : mid(posterId),
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
            console.log('SORT: ', args.order)
            if (!args.order) return undefined
            const [field, dir] = args.order.split(':') as ['price' | 'updated-at', 'asc' | 'desc']
            const dirNum = dir === 'asc' ? -1 : 1
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
      update: updateOne({
        db,
        collection: 'listings',
        toQuery: (id: t.Id<'listing'>) => ({
          _id: mid(id)
        }),
        toUpdate: (patch: Omit<t.Listing, 'id' | 'userId' | 'user' | 'createdAt' | 'location'>) => ({
          $set: {
            ...patch,
            _categoryId: mid(patch.categoryId),
            _text: `${patch.title} ${patch.description}`
          }
        })
      }),
      delete: deleteOne({
        db,
        collection: 'listings',
        toQuery: (id: t.Id<'listing'>) => ({
          _id: mid(id)
        })
      })
    },

    //
    //  REPORTS
    //
    reports: {
      add: addItem({
        db,
        collection: 'reports',
        toDocument: (report: t.ListingReport): t.ListingReportDocument => ({
          ...report,
          _id: mid(report.id),
          _listingId: mid(report.listingId)
        })
      }),
      list: findAll({
        db,
        collection: 'reports',
        query: {
          expiresAt: {
            $gt: Date.now()
          }
        },
        toModel: mappers.ListingReport.toModel
      }),
      find: findItem({
        db,
        collection: 'reports',
        toQuery: (id:  t.Id<'report'>) => ({
          _id: mid(id)
        }),
        toModel: mappers.ListingReport.toModel
      }),
      findForListing: findItem({
        db,
        collection: 'reports',
        toQuery: (listingId: t.Id<'listing'>) => ({
          _listingId: mid(listingId)
        }),
        toModel: mappers.ListingReport.toModel
      }),
      appendEvent: updateOne({
        db,
        collection: 'reports',
        toQuery: (id: t.Id<'report'>) => ({
          _id: mid(id)
        }),
        toUpdate: ({ event }: { event: t.ListingReportEvent }) => ({
          $push: {
            activity: event
          },
          $set: {
            updatedAt: Date.now()
          }
        })
      }),
      update: updateOne({
        db,
        collection: 'reports',
        toQuery: (id: t.Id<'report'>) => ({
          _id: mid(id)
        }),
        toUpdate: (patch: Partial<Pick<t.ListingReport, 'status' | 'dismissedAt' | 'dismissedBy'>>) => ({
          $set: patch
        })
      })
    }
  }
}

export default createMongoClient

export type MongoClient = ReturnType<typeof createMongoClient>
