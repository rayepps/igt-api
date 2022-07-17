import _ from 'radash'
import * as t from '../../core/types'
import { Props } from '@exobase/core'
import { useLogger } from '../../core/hooks/useLogger'
import { useService } from '@exobase/hooks'
import { useCors } from '../../core/hooks/useCors'
import { useLambda } from '@exobase/lambda'
import makeMongo, { MongoClient } from '../../core/mongo'
import mappers from '../../core/view/mappers'
import { usePermissionAuthorization } from '@exobase/auth/dist/permission'
import { useTokenAuthentication } from '../../core/hooks/useTokenAuthentication'
import { permissions } from '../../core/auth'

interface Args {}

interface Services {
  mongo: MongoClient
}

type Response = {
  reports: t.ListingReportView[]
}

async function listAllReports({ services }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services
  const reports = await mongo.reports.list()
  return {
    reports: reports.map(mappers.ListingReportView.toView)
  }
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useTokenAuthentication(),
  usePermissionAuthorization({
    require: [permissions.reports.read]
  }),
  useService<Services>({
    mongo: makeMongo()
  }),
  listAllReports
)
