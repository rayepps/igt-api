import _ from 'radash'
import * as t from '../../core/types'
import { errors, Props } from '@exobase/core'
import { useLogger } from '../../core/hooks/useLogger'
import { useJsonArgs, useService } from '@exobase/hooks'
import { useCors } from '../../core/hooks/useCors'
import { useLambda } from '@exobase/lambda'
import makeMongo, { MongoClient } from '../../core/mongo'
import { usePermissionAuthorization } from '@exobase/auth/dist/permission'
import { useTokenAuthentication } from '../../core/hooks/useTokenAuthentication'
import { permissions } from '../../core/auth'
import mappers from '../../core/view/mappers'

interface Args {
  id: t.Id<'report'>
}

interface Services {
  mongo: MongoClient
}

type Response = {
  report: t.ListingReportView
}

async function dismissReport({ args, services, auth }: Props<Args, Services, t.UserTokenAuth>): Promise<Response> {
  const { id } = args
  const { mongo } = services
  const report = await mongo.reports.find(id)
  if (!report) {
    throw errors.notFound({
      details: `A report with the provided id(${id}) was not found`,
      key: 'igt.err.reports.dismiss.not-found'
    })
  }
  if (report.status === 'dismissed') {
    throw errors.notFound({
      details: `This report has already been dismissed`,
      key: 'igt.err.reports.dismiss.already-dismissed'
    })
  }
  const patch: Partial<t.ListingReport> = {
    status: 'dismissed',
    dismissedAt: Date.now(),
    dismissedBy: {
      id: auth.token.sub as t.Id<'user'>,
      fullName: auth.token.extra.fullName,
      email: auth.token.extra.email
    }
  }
  await mongo.reports.update(id, patch)
  return {
    report: mappers.ListingReportView.toView({
      ...report,
      ...patch
    })
  }
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useJsonArgs(yup => ({
    id: yup.string().required()
  })),
  useTokenAuthentication(),
  usePermissionAuthorization({
    require: [permissions.reports.dismiss]
  }),
  useService<Services>({
    mongo: makeMongo()
  }),
  dismissReport
)
