const get = <T = string>(name: string, defaultValue: T = null, cast: (v: any) => T = v => v): T => {
  const val = process.env[name]
  if (!val) return defaultValue
  return cast(val)
}

const config = {
  env: get('PRAXIS_ENV'),
  apiKey: get('PRAXIS_API_KEY'),
  tokenSignatureSecret: get('TOKEN_SIG_SECRET'),
  googleGeocodingApiKey: get('GOOGLE_GEOCODING_API_KEY'),
  logtailToken: get('LOGTAIL_TOKEN'),
  redisUsername: get('REDIS_USERNAME'),
  redisPassword: get('REDIS_PASSWORD'),
  redisUrl: get('REDIS_URL'),
  mongoUri: get('MONGO_URI'),
  imageKitPublicKey: get('IMAGE_KIT_PUBLIC_KEY'),
  imageKitPrivateKey: get('IMAGE_KIT_PRIVATE_KEY'),
  imageKitUrlEndpoint: get('IMAGE_KIT_URL_ENDPOINT'),
  postmarkToken: get('POSTMARK_TOKEN')
}

export type Config = typeof config

export default config
