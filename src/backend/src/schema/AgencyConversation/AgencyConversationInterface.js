// @flow

import type { AgencyConversationSQL } from './AgencyConversationSchema.js'
import { sqltag } from 'common/sql-template-tag'
import Config from 'common/src/Config.js'
import database from '../../mysql/database.js'
import ID from '../../utils/ID.js'

export default class AgencyConversationInterface {
  static async get(
    agencyId: number,
    agencyConversationId: string,
  ): Promise<?AgencyConversationSQL> {
    const query = sqltag`
      SELECT *
      FROM ${Config.dbPrefix}_AgencyConversation
      WHERE agencyConversationId = UNHEX(${agencyConversationId})
      and agencyId = ${agencyId};
    `
    const rows = await database.query(query)
    return rows[0]
  }

  static async getOwned(
    userId: string,
    agencyConversationId: string,
  ): Promise<?AgencyConversationSQL> {
    const query = sqltag`
      SELECT *
      FROM ${Config.dbPrefix}_AgencyConversation agencyConversation
      LEFT JOIN ${Config.dbPrefix}_Agency agency
      ON agencyConversation.agencyId = agency.agencyId
      WHERE agencyConversation.agencyConversationId = UNHEX(${agencyConversationId})
      AND agency.userId = UNHEX(${userId})
      AND NOT agency.isDeleted;
    `
    const rows = await database.query(query)
    return rows[0]
  }

  static async getForVersion(
    agencyId: number,
  ): Promise<Array<AgencyConversationSQL>> {
    const query = sqltag`
      SELECT *
      FROM ${Config.dbPrefix}_AgencyConversation
      WHERE agencyId = ${agencyId}
      AND isDeleted = FALSE
      ORDER BY agencyId DESC, dateCreated DESC;
    `
    const rows = await database.query(query)
    return rows
  }

  static async getAll(
    agencyVersionId: number,
  ): Promise<Array<AgencyConversationSQL>> {
    const query = sqltag`
      SELECT *
      FROM ${Config.dbPrefix}_AgencyConversation
      WHERE agencyId IN (
          SELECT agencyId 
          FROM ${Config.dbPrefix}_Agency 
          WHERE versionId = ${agencyVersionId}
      )
      AND isDeleted = FALSE
      ORDER BY agencyId DESC, dateCreated DESC;
    `
    const rows = await database.query(query)
    return rows
  }

  static async insert(
    agencyId: number,
    name: string,
    userId: string,
  ): Promise<string> {
    const agencyConversationId = ID.getUnique()

    const query = sqltag`
      INSERT INTO ${Config.dbPrefix}_AgencyConversation (
        agencyConversationId,
        agencyId,
        name,
        startedByUserId
      ) VALUES (
        UNHEX(${agencyConversationId}),
        ${agencyId},
        ${name},
        UNHEX(${userId})
      );
    `

    await database.query(query)

    return agencyConversationId
  }

  static async updateName(
    agencyConversationId: string,
    name: string,
  ): Promise<void> {
    const query = sqltag`
      UPDATE ${Config.dbPrefix}_AgencyConversation SET
      name = ${name},
      dateUpdated = CURRENT_TIMESTAMP
      WHERE agencyConversationId = UNHEX(${agencyConversationId});
    `
    await database.query(query)
  }
}
