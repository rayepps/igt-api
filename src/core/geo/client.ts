import _ from 'radash'
import { Geocoder } from 'node-geocoder'
import * as t from '../types'

export class GeoClient {
  constructor(private geocoder: Geocoder) {}

  async lookupZip(zip: string | number): Promise<[Error, t.GeoLocation]> {
    const [err, result] = await _.try(() => {
      return this.geocoder.geocode({
        zipcode: `${zip}`
      })
    })()
    if (err || !result) {
      return [err, null]
    }
    const [location] = result
    return [null, {
      latitude: location.latitude,
      longitude: location.longitude,
      zip: `${zip}`,
      city: location.city,
      state: location.administrativeLevels?.level1short ?? ''
    }]
  }
  
  async lookupCityState(cityState: string): Promise<[Error, t.GeoLocation]> {
    const [err, result] = await _.try(() => {
      return this.geocoder.geocode({
        address: cityState
      })
    })()
    if (err || !result || result.length === 0) {
      return [err ?? new Error('no location found'), null]
    }
    console.log('result: ', result)
    const [location] = result
    return [null, {
      latitude: location.latitude,
      longitude: location.longitude,
      zip: location.zipcode,
      city: location.city,
      state: location.administrativeLevels?.level1short ?? ''
    }]
  }
}
