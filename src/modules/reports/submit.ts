import _ from 'radash'
import * as t from '../../core/types'
import { errors, Props } from '@exobase/core'
import { useLogger } from '../../core/hooks/useLogger'
import { useJsonArgs, useService } from '@exobase/hooks'
import { useCors } from '../../core/hooks/useCors'
import { useLambda } from '@exobase/lambda'
import makeMongo, { MongoClient } from '../../core/mongo'
import mappers from '../../core/view/mappers'
import model from '../../core/model'

interface Args {
  listingId: t.Id<'listing'>
  message: string
}

interface Services {
  mongo: MongoClient
}

type Response = {
  report: t.ListingReportView
}

async function submitReport({ args, services }: Props<Args, Services>): Promise<Response> {
  const { listingId, message } = args
  const { mongo } = services
  const listing = await mongo.listings.find(listingId)
  if (!listing) {
    throw errors.notFound({
      details: `A listing with the provided id(${listingId}) was not found`,
      key: 'igt.err.reports.submit.listing-not-found'
    })
  }
  const event: t.ListingReportEvent = {
    anonymous: true,
    timestamp: Date.now(),
    user: null,
    snapshot: listing,
    message
  }
  const exitingReport = await mongo.reports.findForListing(listingId)
  const createNew = async () => {
    const newReport: t.ListingReport = {
      id: model.id('report'),
      listingId,
      status: 'pending',
      reports: [event],
      dismissedAt: null,
      dismissedBy: null,
      expiresAt: listing.expiresAt,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    await mongo.reports.add(newReport)
    return newReport
  }
  const updateExisting = async () => {
    await mongo.reports.appendEvent(exitingReport.id, {
      event
    })
    return {
      ...exitingReport,
      reports: [...exitingReport.reports, event]
    }
  }
  const report = await (exitingReport ? updateExisting : createNew)()
  return {
    report: mappers.ListingReportView.toView(report)
  }
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useJsonArgs<Args>(yup => ({
    listingId: yup.string().required(),
    message: yup.string().required()
  })),
  // TODO: Support optional authentication to track who
  // is submiting the report -- if they're logged in
  useService<Services>({
    mongo: makeMongo()
  }),
  submitReport
)
