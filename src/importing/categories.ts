import * as tedious from 'tedious'
import * as t from '../core/types'
import makeMongo, { MongoClient } from '../core/mongo'
import model from '../core/model'
import slugger from 'url-slug'
import mssql from './mssql'
import fmt from '../core/fmt'

const run = async () => {
  console.log('x--> connecting...')
  const connection = await mssql.connect()

  console.log('x--> connected')
  const rows = await connection.execute<CategoryRecord>('SELECT * FROM dbo.CLCategory;')

  console.log('x--> rows')
  console.log(rows[0])

  const mongo = makeMongo()
  for (const record of rows) {
    const id = model.id('category')
    const category: t.Category = {
      id,
      label: record.Title,
      slug: slugger(record.Title),
      _aspRecordId: record.CatID
    }
    console.log('x--> creating... ', category)
    await mongo.categories.add(category)
    await new Promise(res => setTimeout(res, 1000))
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
