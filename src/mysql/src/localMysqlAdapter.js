// @flow

import { execSync, spawn } from 'child_process'
import mysql from 'mysql'
import { platform } from 'os'
import fs from 'fs'
import { kill } from 'cross-port-killer'
import tcpPortUsed from 'tcp-port-used'

const TEMP_DATA_PATH = `/tmp/mysql-local`

let mysqld /*: any*/

export async function start(
  options /*: {
  seedPath?: string,
  version?: number,
  database: string,
  port?: number,
  includeInstallation?: boolean,
  debugMode: boolean,
}*/,
) /*: Promise<void>*/ {
  const {
    seedPath,
    version = 14,
    database,
    port = 3306,
    includeInstallation = false,
    debugMode = false,
  } = options

  const execOptions /*: any*/ = {}

  if (debugMode) {
    execOptions.stdio = 'inherit'
  }

  // const url = `mysql://root@localhost:${port}`

  const isClean = checkClean()
  const installScript = getInstallationScript({
    version,
    port,
    includeInstallation,
  })
  const startScript = getStartScript(port)

  try {
    const killcb = () => {
      if (mysqld) {
        console.log('stopping mysqld...')

        mysqld.on('exit', () => {
          mysqld = null
          process.exit()
          // setTimeout(() => {
          //   process.kill(process.pid, "SIGINT")
          // }, 100)
        })
        mysqld.kill('SIGINT')
        // process.kill(-mysqld.pid)
        // process.exit()
      } else {
        // process.kill(process.pid, "SIGINT")
        process.exit()
      }
    }

    process.once('SIGINT', killcb)

    if (isClean) {
      console.log(installScript)
      execSync(installScript, execOptions)
    } else {
      const inUse = await new Promise((resolve, reject) => {
        tcpPortUsed.check(port, '127.0.0.1').then(
          function (inUse) {
            resolve(inUse)
          },
          function (err) {
            reject(err)
          },
        )
      })
      if (inUse) {
        console.log('Existing database is online.')
        return
      } else {
        console.log('Existing database is offline. Turning on...')
      }
    }

    // stop existing server if any
    // try {
    //   await stop(port)
    // } catch (err) {
    //   if (debugMode) {
    //     console.log('debugMode', debugMode)
    //     console.error(err)
    //   }
    // }

    console.log(startScript)
    mysqld = spawn(startScript.split(' ')[0], startScript.split(' ').slice(1), {
      detached: true,
    })
    mysqld.on('close', () => {
      console.log('mysqld close')
    })
    mysqld.stdout.on('data', (data) => {
      if (debugMode) {
        console.log('stdout', data.toString())
      }
    })
    await new Promise((resolve) => {
      let lastMessage = 'Waiting for mysql server to start... timeout.'
      const timeout = setTimeout(() => {
        console.error(new Error(lastMessage))
      }, 3000)
      mysqld.stderr.on('data', (data) => {
        lastMessage = data.toString()
        if (debugMode) {
          console.log('stderr', data.toString())
        }
        if (data.toString().includes('ready for connections')) {
          clearTimeout(timeout)
          resolve()
        }
      })
    })

    const passwordFix = `mysql --user=root -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY ''"`
    console.log(passwordFix)
    execSync(passwordFix)

    // starting a server from scratch runs the schema.sql
    // restarting a server should ignore schema.sql
    // If schema changes are made, there needs to be a command to delete the database and re-run schema.sql

    console.log('Connecting to mysql...')
    // const client = new pg.Client({
    //   connectionString: url,
    // })
    // client.connect()
    const client = mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      port,
      multipleStatements: true,
    })

    const shouldSeed = isClean && seedPath && !!seedPath?.length
    console.log('shouldSeed', shouldSeed)

    await new Promise((resolve, reject) => {
      // awaiting here to ensure DB is online before continuing.
      client.query(
        // `CREATE DATABASE IF NOT EXISTS ${database};`,
        `SELECT NOW();`,
        (err, res) => {
          if (err) {
            return reject(err)
          }
          resolve(res)
        },
      )
    })
    console.log('Mysql available!')
    client.end()

    // if (shouldSeed && seedPath) {
    //   console.log("Found seed file, seeding...")
    //   const file = fs.readFileSync(seedPath, { encoding: "utf-8" })
    //   console.log(file)
    //   await new Promise((resolve, reject) => {
    //     client.query(file, (err, res) => {
    //       if (err) {
    //         return reject(err)
    //       }
    //       resolve(res)
    //     })
    //   })
    //   client.end()
    //   console.log("Seed done available!")
    // }

    // process.once("SIGUSR2", () => {
    //   console.log("nodemon kill signal")
    //   stop()
    //   process.exit()
    // })

    // if (database) {
    //   return `mysql://root@localhost:${port}/${database}`
    // } else {
    //   return url
    // }
  } catch (e) {
    console.error(e)
    await stop(port)
    throw e
  }
}

export async function stop(port /*: number*/) /*: Promise<void>*/ {
  // const stopScript = getStopScript()
  // console.log(stopScript)
  // execSync(stopScript)

  if (mysqld) {
    await new Promise((resolve) => {
      mysqld.on('exit', () => {
        console.log('mysqld exit')
        mysqld = null
        resolve()
      })
      console.log('sending SIGINT to mysqld')
      mysqld.kill('SIGINT')
    })
  } else {
    await new Promise((resolve) => {
      kill(port).then(() => {
        resolve()
      })
    })
  }

  console.log('mysql server stopped')
}

function checkClean() /*: boolean*/ {
  try {
    const isDir = fs.lstatSync(TEMP_DATA_PATH).isDirectory()
    return !isDir
  } catch (err) {
    return true
  }
}

export function clean() {
  console.log(`rm -rf ${TEMP_DATA_PATH}`)
  execSync(`rm -rf ${TEMP_DATA_PATH}`)
}

export function getInstallationScript(
  {
    version = 14,
    port,
    includeInstallation: includeInstallation = false,
  } /*: any*/,
) /*: string*/ {
  switch (platform()) {
    case 'darwin': {
      const installation = includeInstallation ? `brew install mysql` : ''

      return `
       ${installation}
       mkdir -p ${TEMP_DATA_PATH}/data
       mysqld --initialize-insecure --datadir=${TEMP_DATA_PATH}/data --port=${port} --lower-case-table-names=2 --character-set-server=ascii --collation-server=ascii_general_ci --default-time-zone='+00:00'
      `
    }
    case 'win32': {
      throw new Error('Unsupported OS, try run on MacOS')
    }
    default: {
      throw new Error('Unsupported OS, try run on MacOS')
      // const installation = includeInstallation
      //   ? `sudo apt update; sudo apt install postgresql-${version};`
      //   : ""
      //
      // return `
      //   ${installation}
      //   sudo -u postgres mkdir -p ${TEMP_DATA_PATH}/data;
      //   sudo -u postgres /usr/lib/postgresql/${version}/bin/initdb -D ${TEMP_DATA_PATH}/data;
      // `
    }
  }
}

export function getStartScript(port /*: number*/) /*: string*/ {
  switch (platform()) {
    case 'darwin': {
      return `mysqld --datadir=${TEMP_DATA_PATH}/data --port=${port} --lower-case-table-names=2 --character-set-server=ascii --collation-server=ascii_general_ci --default-time-zone=+00:00`
    }
    case 'win32': {
      throw new Error('Unsupported OS, try run on MacOS')
    }
    default: {
      throw new Error('Unsupported OS, try run on MacOS')
      // return `sudo -u postgres /usr/lib/postgresql/${version}/bin/pg_ctl -o "-F -p ${port}" -D ${TEMP_DATA_PATH}/data -l ${TEMP_DATA_PATH}/logfile start;`
    }
  }
}

export function getStopScript() /*: string*/ {
  switch (platform()) {
    case 'darwin': {
      return `mysql --user=root -e "shutdown;"`
    }
    default: {
      throw new Error('Unsupported OS, try run on MacOS')
      // return `
      //   sudo -u postgres /usr/lib/postgresql/${
      //     options?.version || 14
      //   }/bin/pg_ctl stop -D ${TEMP_DATA_PATH}/data
      //   sudo -u postgres rm -rf ${TEMP_DATA_PATH}
      // `
    }
  }
}
