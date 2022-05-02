import * as tedious from 'tedious'
import * as t from '../core/types'
import makeMongo, { MongoClient } from '../core/mongo'
import model from '../core/model'
import slugger from 'url-slug'
import mssql from './mssql'
import fmt from '../core/fmt'
import makeGeo from '../core/geo'

const run = async () => {
  console.log('x--> connecting...')
  const connection = await mssql.connect()

  console.log('x--> connected')
  const rows = await connection.execute<ListingRecord>(
    "SELECT TOP 50 * FROM dbo.CLListing WHERE IsApproved = 'Y' ORDER BY ListingId DESC;"
  )

  const mongo = makeMongo()
  const geo = makeGeo()

  // Get categories for matching
  const [cerr, categories] = await mongo.listCategories()
  if (cerr) throw cerr

  for (const record of rows) {

    const [lerr, existing] = await mongo.findListingByLegacyId(record.ListingId)
    if (lerr) throw lerr
    if (existing) {
      console.log('SKIPPING: listing with asp record id exists', {
        id: existing.id,
        aspRecordId: existing._aspRecordId
      })
      console.log(existing)
      continue
    }

    const cat = categories.find(c => c._aspRecordId === record.CatId) ?? categories[0]
    const [uerr, user] = await mongo.findUserByLegacyId(record.CustId)
    if (uerr) throw uerr
    if (!user) {
      console.warn('SKIPPING: The user for this listing has not been created', {
        ListingId: record.ListingId,
        CustId: record.CustId
      })
      continue
    }
    const location = await (async () => {
      if (user.location) return user.location
      console.log(`Record: ${record.City.trim()}, ${record.State.trim()}`)
      const [geoErr, geoResult] = await geo.lookupCityState(`${record.City.trim()}, ${record.State.trim()}`)
      if (geoErr) throw geoErr
      if (!geoResult) throw { message: 'Could not find location for listing', record }
      return geoResult
    })()

    console.log('location: ', location)

    if (!user.location) {
      console.log('updating user location!')
      const [uuerr] = await mongo.updateUser({
        id: user.id,
        patch: {
          location
        }
      })
      if (uuerr) throw uuerr
    }

    const listingId = model.id('listing')
    const listing: t.Listing = {
      id: listingId,
      slug: slugger(`${record.Title}-${listingId.replace('igt.listing.', '').substring(0, 5)}`),
      title: record.Title,
      status: record.IsSold === 'Y' ? 'sold' : 'available',
      categoryId: cat.id,
      category: cat,
      description: record.Description,
      price: record.Price,
      displayPrice: fmt.price(record.Price),
      images: photoUrls(record),
      video: record.VideoEmbed
        ? {
            url: record.VideoEmbed
          }
        : null,
      location,
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName
      },
      _aspRecordId: record.ListingId,
      addedAt: new Date(record.DTRun).getTime(),
      updatedAt: Date.now()
    }
    console.log('creating...', listing)
    const [err] = await mongo.addListing(listing)
    if (err) throw err
  }

  connection.close()
}

const photoUrls = (record: ListingRecord): t.Asset[] => {
  const columns = ['Photo1', 'Photo2', 'Photo3', 'Photo4', 'Photo5', 'Photo6', 'Photo7', 'Photo8', 'Photo9', 'Photo10']
    .map(c => ({ name: c, value: record[c] }))
    .filter(c => c.value === 'Y')
    .map(c => c.name)
  // Example https://www.idahoguntrader.net/upload/CL/LG/8/CLListing-10538-Photo1.jpg
  return columns.map(c => {
    const id = `${record.ListingId}`
    const lastDigit = id.substring(id.length - 1, id.length)
    const url = `https://www.idahoguntrader.net/upload/CL/LG/${lastDigit}/CLListing-${id}-${c}.jpg`
    return {
      url,
      id: `${id}-${c}`
    }
  })
}

run()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .then(() => {
    process.exit(0)
  })
