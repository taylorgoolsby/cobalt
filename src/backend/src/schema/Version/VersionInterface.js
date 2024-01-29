// @flow

import type { VersionSQL } from './VersionSchema.js'
import { sqltag } from 'common/sql-template-tag'
import Config from 'common/src/Config.js'
import database from '../../mysql/database.js'

export default class VersionInterface {
  static async getCurrent(): Promise<?VersionSQL> {
    const query = sqltag`
      SELECT * FROM ${Config.dbPrefix}_Version
      WHERE version = ${Config.version}
      AND stage = ${Config.dbPrefix.sql}
      ORDER BY dateCreated;
    `
    const rows = await database.query(query)
    return rows[0]
  }

  static async insertCurrentVersion(): Promise<void> {
    const query = sqltag`
      INSERT INTO ${Config.dbPrefix}_Version (
        version,
        stage
      ) VALUES (
        ${Config.version},
        ${Config.dbPrefix.sql}
      ) ON DUPLICATE KEY UPDATE version = version;
    `
    await database.query(query)
  }

  static async setMigrated(
    version: string,
    runtime: string,
    migrationScript: string,
  ): Promise<void> {
    const query = sqltag`
      UPDATE ${Config.dbPrefix}_Version SET
      isMigrated = TRUE,
      migrationScript = ${migrationScript}
      WHERE version = ${version}
      AND stage = ${runtime};
    `
    await database.query(query)
  }
}
