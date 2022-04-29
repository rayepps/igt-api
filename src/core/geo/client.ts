import { Geocoder } from 'node-geocoder'
import * as t from '../types'

export class GeoClient {
  constructor(private geocoder: Geocoder) {}

  async lookupZip(zip: string | number): Promise<t.GeoLocation> {
    const [location] = await this.geocoder.geocode({
      zipcode: `${zip}`
    })
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      zip: `${zip}`,
      city: location.city,
      state: location.administrativeLevels?.level1short ?? ''
    }
  }
}
