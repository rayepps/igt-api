import * as t from './types'
import { createPermission, createToken, Permission } from '@exobase/auth'
import config from './config'
import dur from 'durhuman'
import bcrypt from 'bcryptjs'

const make = (model: t.Model, action: 'read' | 'create' | 'update' | 'delete', scope?: '*' | t.Id<any>) => {
  return createPermission(model, action, scope)
}

export const permissions = {
  user: {
    read: {
      self: (userId: t.Id<'user'>) => make('user', 'read', userId),
      any: make('user', 'read', '*')
    },
    create: make('user', 'create', '*'),
    update: {
      self: (userId: t.Id<'user'>) => make('user', 'update', userId),
      any: make('user', 'update', '*')
    },
    delete: {
      self: (userId: t.Id<'user'>) => make('user', 'delete', userId),
      any: make('user', 'delete', '*')
    }
  },
  category: {
    read: make('category', 'read', '*'),
    update: make('category', 'update', '*'),
    create: make('category', 'create', '*'),
    delete: make('category', 'delete', '*'),
  },
  listing: {
    read: make('listing', 'read', '*'),
    update: {
      any: make('listing', 'update', '*'),
      owned: (userId: t.Id<'user'>) => make('listing', 'update', userId)
    },
    create: make('listing', 'create', '*'),
    delete: {
      any: make('listing', 'delete', '*'),
      owned: (userId: t.Id<'user'>) => make('listing', 'delete', userId)
    },
  },
  sponsor: {
    read: make('sponsor', 'read', '*'),
    update: make('sponsor', 'update', '*'),
    create: make('sponsor', 'create', '*'),
    delete: make('sponsor', 'delete', '*'),
  }
}

export const permissionsForUser = (user: t.User): Permission[] => {
  switch (user.role) {
    case 'admin':
      return [
        permissions.user.create,
        permissions.user.read.any,
        permissions.user.read.self(user.id),
        permissions.user.update.any,
        permissions.user.update.self(user.id),
        permissions.category.read,
        permissions.category.create,
        permissions.category.update,
        permissions.category.delete,
        permissions.sponsor.read,
        permissions.sponsor.create,
        permissions.sponsor.update,
        permissions.sponsor.delete,
        permissions.listing.create,
        permissions.listing.delete.any,
        permissions.listing.read,
        permissions.listing.update.any,
      ]
    case 'user':
      return [
        permissions.user.read.self(user.id),
        permissions.user.update.self(user.id),
        permissions.listing.create,
      ]
    case 'admin-observer':
      return [
        permissions.user.read.any,
        permissions.user.update.any,
        permissions.user.read.self(user.id),
        permissions.user.update.self(user.id),
        permissions.category.read,
        permissions.sponsor.read,
        permissions.listing.read,
      ]
  }
}

const SALT_ROUNDS = 10
export const generatePasswordHash = async (password: string): Promise<[Error, string]> => {
  return new Promise(resolve => {
    bcrypt.hash(password, SALT_ROUNDS, (err, hash) => {
      if (err) resolve([err, null])
      else resolve([null, hash])
    })
  })
}

export async function comparePasswordToHash(providedPassword: string, savedHash: string): Promise<[Error, boolean]> {
  return new Promise(resolve => {
    bcrypt.compare(providedPassword, savedHash, (err, isMatch) => {
      if (err) resolve([err, false])
      else resolve([null, isMatch])
    })
  })
}

export const generateToken = (user: t.User) => createToken({
  sub: user.id,
  type: 'id',
  aud: 'igt.app',
  iss: 'igt.api',
  entity: 'user',
  ttl: dur('7 days'),
  permissions: permissionsForUser(user),
  provider: 'igt',
  extra: {
    email: user.email
  },
  secret: config.tokenSignatureSecret
})