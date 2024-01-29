// @flow

import mysql from 'mysql'
import Config from 'common/src/Config.js'
import { createScript } from '../schema/generateSql.js'
import typeCast from './typeCast.js'

export default async function getPool(
  host: string,
  port: number,
  user: string,
  password: ?string,
  database: string,
): Promise<any> {
  console.log('Using remote database at host: ' + Config.dbHost)
  const connection = mysql.createConnection({
    host,
    port,
    user,
    password,
  })
  await new Promise((resolve, reject) => {
    console.log(`CREATE DATABASE IF NOT EXISTS ${Config.dbDatabase};`)
    connection.query(
      `CREATE DATABASE IF NOT EXISTS ${Config.dbDatabase};`,
      (err, res) => {
        if (err) {
          return reject(err)
        }
        resolve(res)
      },
    )
  })
  connection.end()

  const pool = mysql.createPool({
    connectionLimit: 10,
    host,
    port,
    user,
    password,
    database,
    multipleStatements: true,
    typeCast,
    charset: 'utf8mb4_unicode_ci',
    timezone: '+00:00',
    // dateStrings: true
  })

  try {
    await new Promise((resolve, reject) => {
      // The Version table should exist if it has been initialized.
      pool.query(
        `SELECT * FROM ${Config.dbPrefix.sql}_Version;`,
        (err, res) => {
          if (err) {
            return reject(err)
          }
          resolve(res)
        },
      )
    })
  } catch (err) {
    if (err.message.startsWith(`ER_NO_SUCH_TABLE`)) {
      console.log('Seeding...')
      // const seedPath = path.resolve(__dirname, "../schema/schema.sql")
      // const file = fs.readFileSync(seedPath, { encoding: "utf-8" })
      console.log(createScript)
      await new Promise((resolve, reject) => {
        pool.query(createScript, (err, res) => {
          if (err) {
            return reject(err)
          }
          resolve(res)
        })
      })
    } else {
      throw err
    }
  }

  // process.on("SIGINT", () => {
  //   console.log("ctrl+c kill signal on pool")
  //   pool.end()
  //   process.exit()
  // })

  return pool
}
