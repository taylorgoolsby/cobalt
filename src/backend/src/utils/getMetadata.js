// @flow

import Config from 'common/src/Config.js'
import database from '../mysql/database.js'
import { sqltag } from 'common/sql-template-tag'

export type Metadata = {
  version: string,
  stage: string,
  currentServerTime?: string,
}

export default async function getMetadata(req: any): Promise<Metadata> {
  const rows = await database.query(sqltag`SELECT NOW() AS now;`)
  const currentServerTime = rows[0].now

  return {
    version: Config.version,
    stage: Config.stage,
    currentServerTime,
  }
}
