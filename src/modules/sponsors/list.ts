import _ from 'radash'
import * as t from '../../core/types'
import type { Props } from '@exobase/core'
import { useLogger } from '../../core/hooks/useLogger'
import { useService } from '@exobase/hooks'
import { useCors } from '../../core/hooks/useCors'
import { useLambda } from '@exobase/lambda'
import makeMongo, { MongoClient } from '../../core/mongo'
import { usePermissionAuthorization } from '@exobase/auth/dist/permission'
import { useTokenAuthentication } from '../../core/hooks/useTokenAuthentication'
import { permissions } from '../../core/auth'
import mappers from '../../core/view/mappers'

interface Args {}

interface Services {
  mongo: MongoClient
}

interface Response {
  sponsors: t.SponsorView[]
}

async function listSponsors({ services }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services
  const sponsors = await mongo.sponsors.list()
  return {
    sponsors: sponsors.map(mappers.SponsorView.toView)
  }
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useService<Services>({
    mongo: makeMongo()
  }),
  listSponsors
)
