import * as tedious from 'tedious'
import * as t from '../core/types'
import makeMongo, { MongoClient } from '../core/mongo'
import model from '../core/model'
import slugger from 'url-slug'
import mssql from './mssql'
import fmt from '../core/fmt'
import { generatePasswordHash } from '../core/auth'

const run = async () => {
  console.log('x--> connecting...')
  const connection = await mssql.connect()

  console.log('x--> connected')
  const rows = await connection.execute<CustomerRecord>('SELECT TOP 250 * FROM dbo.MGCustomer WHERE isActive = \'Y\' ORDER BY DTLastVisited DESC;')

  const mongo = makeMongo()
  for (const record of rows) {
    const [lookupError, existing] = await mongo.findUserByLegacyId(record.CustId)
    if (lookupError) throw lookupError
    if (existing) {
      console.warn('SKIPPING: User with record id already exists: ', {
        id: existing.id,
        aspRecordId: existing._aspRecordId
      })
      continue
    }
    const id = model.id('user')
    const [perr, hash] = await generatePasswordHash(record.Password)
    if (perr) throw perr
    const user: t.User = {
      id,
      email: record.Email,
      fullName: `${record.FirstName.trim()} ${record.LastName.trim()}`,
      phone: record.Phone ?? null,
      role: 'user',
      location: null, // Updated when importing listings
      disabled: record.IsActive === 'N',
      _passwordHash: hash,
      _passwordReset: null,
      _aspRecordId: record.CustId,
      lastLoggedInAt: new Date(record.DTLastVisited).getTime(),
      createdAt: new Date(record.DTAdded).getTime(),
      updatedAt: Date.now()
    }
    console.log('adding...', user)
    const [err] = await mongo.addUser(user)
    if (err) throw err

    await new Promise(res => setTimeout(res, 500))
  }

  connection.close()
}

run()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .then(() => {
    process.exit(0)
  })
