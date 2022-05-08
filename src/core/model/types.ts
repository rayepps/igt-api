
//
//  LEGEND
//
//  _ = private, should not be deliverd to client, ever, internal
//  $ = nosql non-normal duplication of source record, compressed
//
//  This convention helps us easily identify internal fields that
//  should never be exposed to the user -- namely in the mappers.
//  It also helps identify non-normalized fields that need to be
//  kept in sync with the source.
//

export type Model = 'user' | 'listing' | 'sponsor' | 'category' | 'view'
export type Id <M extends Model> = `igt.${M}.${string}`
export type UserRole = 'user' | 'admin' | 'admin-observer'
export type ListingOrder = `${'price' | 'updated-at'}:${'asc' | 'desc'}`
export type UserOrder = `${'logged-in' | 'created-at'}:${'asc' | 'desc'}`
export type SponsorTier = 'trial' | 'free' | 'partner' | 'featured'
export type SponsorStatus = 'active' | 'disabled'
export type ListingStatus = 'available' | 'sold'

export interface User {
  id: Id<'user'>
  email: string
  fullName: string
  phone: null | string
  role: UserRole
  location: GeoLocation
  disabled: boolean
  _passwordHash: string
  _passwordReset: null | {
    requestedAt: number
    code: string
  }
  lastLoggedInAt: number
  createdAt: number
  updatedAt: number
  _aspRecordId: number | null
}

export interface GeoPoint {
  longitude: number
  latitude: number
}

export interface GeoLocation {
  longitude: number
  latitude: number
  city: string
  state: string
  zip: string
}

export interface Category {
  id: Id<'category'>
  label: string
  slug: string
  _aspRecordId: number | null
}

export interface Asset {
  id: string
  url: string
}

export interface Listing {
  id: Id<'listing'>
  title: string
  slug: string
  status: ListingStatus
  categoryId: Id<'category'>
  category: Category
  description: string
  price: number | null
  displayPrice: string
  images: Asset[]
  video: Omit<Asset, 'id'> | null
  location: GeoLocation
  userId: Id<'user'>
  user: Pick<User, 'id' | 'email' | 'fullName'>
  _aspRecordId: number | null
  addedAt: number
  updatedAt: number
  expiresAt: number
}

export interface PageViewEvent {
  id: Id<'view'>
  class: 'listing'
  timestamp: number
  listingId: Id<'listing'>
  userId: Id<'user'>
  categoryId: Id<'category'>
}

export interface SponsorEngagedEvent {
  id: Id<'view'>
  class: 'sponsor'
  timestamp: number
  sponsorId: Id<'sponsor'>
  campaignKey: string
  type: 'impression' | 'click-through'
}

export interface SponsorCampaign {
  name: string
  key: string
  images: Asset[]
  video: null | Omit<Asset, 'id'>
  title: null | string
  subtext: null | string
  cta: null | string
  url: null | string
  createdAt: number
  updatedAt: number
}

export interface Sponsor {
  id: Id<'sponsor'>
  status: SponsorStatus
  name: string
  tier: SponsorTier
  categories: Category[]
  campaigns: SponsorCampaign[]
  deleted: boolean
  deletedAt: number
  createdAt: number
  updatedAt: number
}