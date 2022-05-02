import _ from 'radash'
import { useLambda } from '@exobase/lambda'
import { useLogger } from '../../core/hooks/useLogger'
import { useCors } from '../../core/hooks/useCors'
import ImageKit from 'imagekit'
import config from '../../core/config'

type Response = {
  token: string
  expire: number
  signature: string
}

async function authenticate(): Promise<Response> {
  const imagekit = new ImageKit({
    publicKey: config.imageKitPublicKey,
    privateKey: config.imageKitPrivateKey,
    urlEndpoint: config.imageKitUrlEndpoint
  })
  return imagekit.getAuthenticationParameters()
}

export default _.compose(
  useLogger(), 
  useLambda(), 
  useCors(), 
  authenticate
)
