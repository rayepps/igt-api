import _ from 'radash'
import * as t from '../../core/types'
import type { Props } from '@exobase/core'
import { useLogger } from '../../core/hooks/useLogger'
import { useJsonArgs, useService } from '@exobase/hooks'
import { useCors } from '../../core/hooks/useCors'
import { useLambda } from '@exobase/lambda'
import makeMongo, { MongoClient } from '../../core/mongo'
import { useTokenAuthentication } from '../../core/hooks/useTokenAuthentication'
import { usePermissionAuthorization } from '@exobase/auth/dist/permission'
import { permissions } from '../../core/auth'
import mappers from '../../core/view/mappers'
import { TokenAuth } from '@exobase/auth'

interface Args {}

interface Services {
  mongo: MongoClient
}

type Response = {
  user: t.UserView
}

async function getSelf({ args, services, auth }: Props<Args, Services, TokenAuth>): Promise<Response> {
  const { mongo } = services
  const userId = auth.token.sub as t.Id<'user'>
  const user = await mongo.users.find(userId)
  return {
    user: mappers.UserView.toView(user)
  }
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useTokenAuthentication(),
  useService<Services>({
    mongo: makeMongo()
  }),
  getSelf
)
