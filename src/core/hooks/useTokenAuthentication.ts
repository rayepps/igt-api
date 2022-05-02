import { useTokenAuthentication as useExoTokenAuthentication } from '@exobase/auth'
import config from '../config'

export const useTokenAuthentication = () => useExoTokenAuthentication({
  type: 'id',
  iss: 'igt.api',
  aud: 'igt.app',
  tokenSignatureSecret: config.tokenSignatureSecret
})