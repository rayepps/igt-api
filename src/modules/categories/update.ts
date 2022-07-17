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

interface Args {
  id: t.Id<'category'>
  label: string
  slug: string
}

interface Services {
  mongo: MongoClient
}

type Response = void

async function updateCategory({ args, services }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services

  const existing = await mongo.categories.findBySlug(args.slug)
  if (existing) {
    throw errors.badRequest({
      details: `A category with the provided slug (${args.slug}) already exists. Slugs must be unique`,
      key: 'igt.err.categories.update.slug-exists'
    })
  }

  await mongo.categories.update(args.id, {
    label: args.label,
    slug: args.slug
  })
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useTokenAuthentication(),
  usePermissionAuthorization({
    require: [permissions.category.update]
  }),
  useJsonArgs<Args>(yup => ({
    id: yup.string().required(), // TODO: Match pattern igt.category.{id}
    label: yup.string().required(),
    slug: yup.string().matches(/^[a-z0-9\-]*$/).required()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  updateCategory
)
