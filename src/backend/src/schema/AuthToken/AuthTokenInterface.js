// @flow

import { sqltag } from 'common/sql-template-tag'
import Config from 'common/src/Config.js'
import database from '../../mysql/database.js'
import type { AuthTokenSQL } from './AuthTokenSchema.js'
import ID from '../../utils/ID.js'

export default class AuthTokenInterface {
  static async getActive(authTokenId: string): Promise<?AuthTokenSQL> {
    const query = sqltag`
      SELECT * 
      FROM ${Config.dbPrefix}_AuthToken 
      WHERE authTokenId = UNHEX(${authTokenId})
      AND dateDeleted IS NULL;
    `
    const rows = await database.query(query)
    return rows[0]
  }

  static async getByToken(key: string): Promise<?AuthTokenSQL> {
    const query = sqltag`
      SELECT * 
      FROM ${Config.dbPrefix}_AuthToken 
      WHERE token = ${key}
      AND dateDeleted IS NULL;
    `
    const rows = await database.query(query)
    return rows[0]
  }

  static async getActiveTokensForAgency(
    userId: string,
    agencyId: number,
  ): Promise<Array<AuthTokenSQL>> {
    const query = sqltag`
      SELECT at.*
      FROM ${Config.dbPrefix}_AuthToken at
      LEFT JOIN ${Config.dbPrefix}_Agency a
      ON at.agencyVersionId = a.versionId
      WHERE a.userId = UNHEX(${userId})
      AND a.agencyId = ${agencyId}
      AND at.dateDeleted IS NULL;
    `
    const rows = await database.query(query)
    return rows
  }

  static async insert(
    agencyVersionId: number,
    name: string,
    createdByUserId: string,
  ): Promise<{ authTokenId: string, token: string }> {
    const authTokenId = ID.getUnique()
    const token = ID.generateAuthKey()

    const query = sqltag`
      INSERT INTO ${Config.dbPrefix}_AuthToken (
        authTokenId,
        agencyVersionId,
        name,
        token,
        createdByUserId
      ) VALUES (
        UNHEX(${authTokenId}),
        ${agencyVersionId},
        ${name},
        ${token},
        UNHEX(${createdByUserId})
      );
    `

    await database.query(query)

    return {
      authTokenId,
      token,
    }
  }

  static async softDelete(authTokenId: string): Promise<any> {
    const query = sqltag`
      UPDATE ${Config.dbPrefix}_AuthToken
      SET dateDeleted = CURRENT_TIMESTAMP
      WHERE authTokenId = UNHEX(${authTokenId});
    `
    await database.query(query)
  }
}
