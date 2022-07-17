import _ from 'radash'
import { Geocoder } from 'node-geocoder'
import * as t from '../types'

export const makeGeoClient = (geocoder: Geocoder) => {

  const lookupZip = async (zip: string | number): Promise<t.GeoLocation> => {
    // One of the weirdest behaviors ever, if you pass
    // zip to the zipcode arg it can't find the location
    // so we pass it to address.
    const result = await geocoder.geocode({
      country: 'United States',
      countryCode: 'US',
      address: `${zip}`
    })
    if (!result || !result[0]) {
      throw 'Location not found'
    }
    const [location] = result
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      zip: `${zip}`,
      city: location.city,
      state: location.administrativeLevels?.level1short ?? ''
    }
  }

  const lookupCityState = async (cityState: string): Promise<t.GeoLocation> => {
    const result = await geocoder.geocode({
      address: cityState
    })
    if (!result || !result[0]) {
      throw 'Location not found'
    }
    const [location] = result
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      zip: location.zipcode,
      city: location.city,
      state: location.administrativeLevels?.level1short ?? ''
    }
  }

  return {
    lookupZip,
    lookupCityState
  }
}

export type GeoClient = ReturnType<typeof makeGeoClient>