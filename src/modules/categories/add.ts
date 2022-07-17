import _ from 'radash'
import * as t from '../../core/types'
import { errors, Props } from '@exobase/core'
import { useLogger } from '../../core/hooks/useLogger'
import { useJsonArgs, useService } from '@exobase/hooks'
import { useCors } from '../../core/hooks/useCors'
import { useLambda } from '@exobase/lambda'
import makeMongo, { MongoClient } from '../../core/mongo'
import model from '../../core/model'
import { usePermissionAuthorization } from '@exobase/auth/dist/permission'
import { useTokenAuthentication } from '../../core/hooks/useTokenAuthentication'
import { permissions } from '../../core/auth'
import mappers from '../../core/view/mappers'

interface Args {
  label: string
  slug: string
}

interface Services {
  mongo: MongoClient
}

interface Response {
  category: t.CategoryView
}

async function addCategory({ args, services }: Props<Args, Services>): Promise<Response> {
  const { mongo } = services
  const [err, existing] = await _.try(mongo.categories.findBySlug)(args.slug)
  if (err) throw err
  if (existing) {
    throw errors.badRequest({
      details: `A category with the provided slug (${args.slug}) already exists. Slugs must be unique`,
      key: 'igt.err.categories.add.slug-exists'
    })
  }
  const category: t.Category = {
    id: model.id('category'),
    slug: args.slug,
    label: args.label,
    _aspRecordId: null
  }
  await mongo.categories.add(category)
  return {
    category: mappers.CategoryView.toView(category)
  }
}

export default _.compose(
  useLogger(),
  useLambda(),
  useCors(),
  useTokenAuthentication(),
  usePermissionAuthorization({
    require: [permissions.category.create]
  }),
  useJsonArgs<Args>(yup => ({
    label: yup.string().required(),
    slug: yup.string().matches(/^[a-z0-9\-]*$/).required()
  })),
  useService<Services>({
    mongo: makeMongo()
  }),
  addCategory
)
