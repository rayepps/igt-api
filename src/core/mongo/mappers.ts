import * as t from '../types'
import _ from 'radash'

export class Category {
  static toModel(document: t.CategoryDocument): t.Category {
    return document as t.Category
  }
}

export class Sponsor {
  static toModel(document: t.SponsorDocument): t.Sponsor {
    return document as t.Sponsor
  }
}

export class User {
  static toModel(document: t.UserDocument): t.User {
    return document as t.User
  }
}

export class Listing {
  static toModel(document: t.ListingDocument): t.Listing {
    return _.shake({
      ...document,
      _location: undefined
    }) as t.Listing
  }
}

export class ListingReport {
  static toModel(document: t.ListingReportDocument): t.ListingReport {
    return document as t.ListingReport
  }
}