import { assert } from 'chai'
import { permissionsForUser } from '../token'
import { permissions } from '../permissions'
import * as t from '../types'

test('permissionsForUser includes admin permissions when user is an admin', () => {
  const results = permissionsForUser({
    acl: 'admin'
  } as any as t.User)
  // Only admins would ever have this
  const createUserPermission = results.filter(x => x.key === permissions.create_user.key)
  assert.isNotEmpty(createUserPermission)
  assert.isNotNull(createUserPermission[0])
})
