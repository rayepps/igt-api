/**
 *
 *  LEGACY DATABASE RECORD TYPES
 *
 */

type YesOrNo = 'Y' | 'N'

type ListingRecord = {
  ListingId: number
  CustId: number
  AreaId: number
  StartDate: string
  EndDate: string
  DTRun: string
  IsDraft: YesOrNo
  IsFeatured: YesOrNo
  IsApproved: YesOrNo
  Title: string
  ShortDescription: string | null
  Description: string
  CatId: number
  Photo1: YesOrNo
  Photo2: YesOrNo
  Photo3: YesOrNo
  Photo4: YesOrNo
  Photo5: YesOrNo
  Photo6: null
  Photo7: null
  Photo8: null
  Photo9: null
  Photo10: null
  VideoEmbed: ''
  Address1: ''
  Address2: ''
  City: string
  State: string
  PostalCode: string
  Country: string
  Phone: string
  AltPhone: string
  Fax: string
  Email: string
  URL: string
  Latitude: null | number
  Longitude: null | number
  ViewCount: number
  RatingAvg: null
  OrgName: string
  FirstName: string
  LastName: string
  CouponPhoto: YesOrNo
  PlanOrSubId: number
  PlanSource: 'I'
  MaxPhotos: 10
  IncludesURL: YesOrNo
  IncludesVideo: YesOrNo
  IncludesFeatured: YesOrNo
  IncludesCoupon: YesOrNo
  IncludeProfile: YesOrNo
  Qty: number
  Price: number
  IsBestOffer: YesOrNo
  Condition: 'U' | 'N'
  PaymentInfo: string
  ShippingInfo: string
  TaxInfo: string
  ContactCount: null
  QRCode: null
  SocialURL_Facebook: string
  SocialURL_Twitter: null
  SocialURL_LinkedIn: null
  SocialURL_Instagram: string
  IsSold: YesOrNo
  StripeSubId: null
}

type CategoryRecord = {
  CatID: number
  ParentCatID: number
  Title: string
  AllowPosting: YesOrNo
  ShowInNavigation: YesOrNo
  IsActive: YesOrNo
  SortOrder: number
  CatCount: number
  SEOFriendlyName: string
}

type CustomerRecord = {
  CustId: number
  IsActive: YesOrNo
  OrgName: string
  FirstName: string
  LastName: string
  Address1: string
  Address2: string
  City: string
  State: string
  PostalCode: string
  Country: string
  Phone: string
  AltPhone: string
  Fax: string
  Email: string
  Password: string
  OkToEmail: YesOrNo
  URL: null
  SourceId: number
  AffId: number
  Photo: null
  Logo: null
  PersonalProfile: string
  Notes: string
  DTAdded: string
  DTUpdated: string
  DTLastVisited: string
  DTLastEmailed: string
  PrivateAddress: YesOrNo
  PrivatePhone: YesOrNo
  PrivateCustName: YesOrNo
  IsAgent: YesOrNo
  IsAutoDealer: YesOrNo
  IsEmployer: YesOrNo
  IsJobSeeker: YesOrNo
  IsEventVenue: null
  PreRegistered: null
  PreRegEmailDTStamp: null
  RegValGUID: string
  RememberMeGUID: string
  Latitude: null
  Longitude: null
  RatingAvg: null
  SocialURL_Facebook: null
  SocialURL_LinkedIn: null
  SocialURL_Twitter: null
  IsBreeder: YesOrNo
  RegistrationMethod: null
  FacebookUserId: null
  GoogleUserId: null
  TwitterUserId: null
  LinkedInUserId: null
  QRCode: null
  IsPremiumMember: null
  FacebookAccessToken: null
  SocialURL_Instagram: null
  importid: null
  TimeZone: string
  StripeCustId: null
}
