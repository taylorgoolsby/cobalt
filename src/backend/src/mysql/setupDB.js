import getPool from './getPool.js'
import Config from 'common/src/Config.js'

// if (Config.runtime === "local") {
//   const { start } = await import("./localMysqlInterface.js")
//   await start(3306)
// }

export const pool = await getPool(
  Config.dbHost,
  Config.dbPort,
  Config.dbUser,
  Config.dbPassword,
  Config.dbDatabase,
)

const confirmation = await new Promise((resolve, reject) => {
  // awaiting here to ensure DB is online before continuing
  pool.query('SELECT NOW();', (err, res) => {
    if (err) {
      return reject(err)
    }
    resolve(res)
  })
})
console.log('Current server time', confirmation)
