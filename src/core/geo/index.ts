import NodeGeocoder from 'node-geocoder'
import { makeGeoClient, GeoClient } from './client'
import config from '../config'

/**
 * In the world of javascript packages node-fetch
 * is the chubby glue licking kid that still spits
 * when he talks energetically and farts in front 
 * of the pretty girls he has crushes on.
 * 
 * In short, the node-geocoder requires() node-fetch
 * and uses it by default if you don't pass a fetch
 * arg. However, node-fetch exports a module, not a
 * function. We have to manually require() it and
 * access the actual fetch func with .default and give
 * it to the geocoder to use.
 */
const nodeFetch = require('node-fetch')

export type { GeoClient }

export default function makeGeo() {
  return makeGeoClient(
    NodeGeocoder({
      provider: 'google',
      apiKey: config.googleGeocodingApiKey,
      fetch: nodeFetch.default
    } as any)
  )
}