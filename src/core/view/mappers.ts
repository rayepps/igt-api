import * as t from '../types'
import addDays from 'date-fns/addDays'
import isAfter from 'date-fns/isAfter'

export class UserView {
  static toView(model: t.User): t.UserView {
    return {
      _view: 'igt.user',
      id: model.id,
      fullName: model.fullName,
      email: model.email,
      phone: model.phone,
      role: model.role,
      lastLoggedInAt: model.lastLoggedInAt,
      createdAt: model.createdAt,
      location: model.location
    }
  }
}

export class CategoryView {
  static toView(model: t.Category): t.CategoryView {
    return {
      _view: 'igt.category',
      id: model.id,
      slug: model.slug,
      label: model.label
    }
  }
}

export class SponsorView {
  static toView(model: t.Sponsor): t.SponsorView {
    return {
      _view: 'igt.sponsor',
      id: model.id,
      name: model.name,
      status: model.status,
      tier: model.tier,
      categories: model.categories.map(CategoryView.toView),
      campaigns: model.campaigns,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    }
  }
}

export class ListingView {
  static toView(model: t.Listing): t.ListingView {
    return {
      _view: 'igt.listing',
      id: model.id,
      title: model.title,
      slug: model.slug,
      status: model.status,
      categoryId: model.categoryId,
      category: CategoryView.toView(model.category),
      description: model.description,
      price: model.price,
      displayPrice: model.displayPrice,
      images: model.images,
      video: model.video,
      location: model.location,
      userId: model.userId,
      user: {
        _view: 'igt.user',
        id: model.user.id,
        fullName: model.user.fullName
      },
      addedAt: model.addedAt,
      updatedAt: model.updatedAt,
      expiresAt: model.expiresAt
    }
  }
}

export default {
  UserView,
  CategoryView,
  ListingView,
  SponsorView
}
