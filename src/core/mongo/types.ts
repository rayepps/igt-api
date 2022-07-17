import * as t from '../model/types'
import type { ObjectId } from 'mongodb'

export interface MongoDocument {
  _id: ObjectId
}

export type CategoryDocument = MongoDocument & t.Category

export type SponsorDocument = MongoDocument & t.Sponsor

export type UserDocument = MongoDocument & t.User

export type ListingDocument = MongoDocument & t.Listing & {
  _categoryId: ObjectId
  _userId: ObjectId
  _text: string
  _location: {
    type: 'Point'
    coordinates: [number, number]
  }
}

export type ListingReportDocument = MongoDocument & t.ListingReport & {
  _listingId: ObjectId
}
