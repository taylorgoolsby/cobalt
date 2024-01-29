// @flow

import * as localMysql from './localMysqlAdapter.js'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import Config from 'common/src/Config.js'

// $FlowFixMe
const __dirname = dirname(fileURLToPath(import.meta.url))

// returns the server url
export async function start(port: number): Promise<void> {
  await localMysql.start({
    seedPath: path.resolve(__dirname, '../schema/schema.sql'),
    version: 14,
    database: `${Config.dbPrefix.sql}_${Config.dbDatabase}`,
    port: Config.dbPort,
    includeInstallation: false,
    debugMode: false,
  })
}

export async function stop(port: number) {
  await localMysql.stop(port)
}
