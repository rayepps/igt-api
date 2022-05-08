import * as t from '../model/types'

export interface UserView {
  _view: 'igt.user'
  id: string
  email: string
  createdAt: number
  fullName: string
  phone: string
  role: t.UserRole
  lastLoggedInAt: number
  location: t.GeoLocation
}

export type CategoryView = {
  _view: 'igt.category'
  id: string
  slug: string
  label: string
}

export type SponsorView = {
  _view: 'igt.sponsor'
  id: string
  name: string
  status: t.SponsorStatus
  tier: t.SponsorTier
  categories: CategoryView[]
  campaigns: t.SponsorCampaign[]
  createdAt: number
  updatedAt: number
}

export type ListingView = {
  _view: 'igt.listing'
  id: string
  title: string
  slug: string
  status: t.ListingStatus
  categoryId: string
  category: CategoryView
  description: string
  price: number
  displayPrice: string
  images: t.Asset[]
  video: Omit<t.Asset, 'id'> | null
  location: t.GeoLocation
  userId: string
  user: Pick<UserView, '_view' | 'id' | 'fullName'>
  addedAt: number
  updatedAt: number
  expiresAt: number
}