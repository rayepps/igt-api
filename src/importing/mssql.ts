import * as tedious from 'tedious'

const connect = async (): Promise<Connection> => {
  const connection = new tedious.Connection({
    server: process.env.SQL_SERVER,
    authentication: {
      type: 'default',
      options: {
        userName: process.env.SQL_USERNAME,
        password: process.env.SQL_PASSWORD
      }
    },
    options: {
      encrypt: true,
      database: process.env.SQL_DATABASE,
      trustServerCertificate: true
    }
  })
  return new Promise<Connection>((res, rej) => {
    connection.on('connect', function (err) {
      if (err) rej(err)
      else
        res({
          execute: execute(connection),
          close: connection.close.bind(connection)
        })
    })
    connection.connect()
  })
}

const execute =
  (connection: tedious.Connection) =>
  async <TRow = any>(sql: string): Promise<TRow[]> => {
    const rows: any[] = []
    let error: Error | null = null
    const request = new tedious.Request(sql, err => (error = err))
    request.on('row', (columns: tedious.ColumnValue[]) => {
      rows.push(
        columns.reduce((acc, col) => {
          return { ...acc, [col.metadata.colName]: col.value }
        }, {})
      )
    })
    request.on('error', err => (error = err))
    return new Promise((res, rej) => {
      request.on('requestCompleted', () => {
        if (error) rej(error)
        else res(rows)
      })
      connection.execSql(request)
    })
  }

type Connection = {
  execute: <TRow = any>(sql: string) => Promise<TRow[]>
  close: () => void
}

export default {
  connect
}
