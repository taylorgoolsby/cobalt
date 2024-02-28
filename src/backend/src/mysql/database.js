// @flow

import mysql from 'mysql'

type ReadResponse = Array<any>

type NonReadResponse = {
  fieldCount: number,
  affectedRows: number,
  insertId: number,
  serverStatus: number,
  warningCount: number,
  message: string,
  protocol41: boolean,
  changedRows: number,
}

// The backend has two different entry points:
// - server.js
// - generateSql.js
// - generateSchema.js
let _pool
async function importPool() {
  const { pool } = await import('./setupDB.js')
  _pool = pool
}

export function flattenSql(queryObject: any): string {
  return mysql.format(queryObject.sql, queryObject.values)
}

async function query(queryObject: {
  sql: Array<string>,
  values: Array<string>,
}): Promise<any> {
  if (!_pool) {
    await importPool()
  }

  // console.debug(mysql.format(queryObject.sql, queryObject.values))

  const res = await new Promise((resolve, reject) => {
    _pool.query(queryObject, (err, res) => {
      if (err) {
        console.error(err.message)
        return reject(err)
      }
      resolve(res)
    })
  })
  return res
}

async function unsafeQuery(
  queryString: string,
): Promise<ReadResponse | NonReadResponse> {
  if (!_pool) {
    await importPool()
  }

  console.debug(queryString)

  const res = await new Promise((resolve, reject) => {
    _pool.query(queryString, (err, res) => {
      if (err) {
        console.error(err.message)
        return reject(err)
      }
      resolve(res)
    })
  })
  // $FlowFixMe
  return res
}

export default {
  query,
  unsafeQuery,
}
