// @flow

import { sqltag, join } from 'common/sql-template-tag'
import Config from 'common/src/Config.js'
import database from '../../mysql/database.js'
import type { AgentConversationSQL } from './AgentConversationSchema.js'
import ID from '../../utils/ID.js'

export default class AgentConversationInterface {
  static async get(
    agencyConversationId: string,
    agentId: number,
  ): Promise<?AgentConversationSQL> {
    const sql = sqltag`
      SELECT *
      FROM ${Config.dbPrefix}_AgentConversation
      WHERE agencyConversationId = UNHEX(${agencyConversationId}) 
      AND agentId = ${agentId}
      AND isDeleted = FALSE;
    `
    const rows = await database.query(sql)
    return rows[0]
  }

  /*
    Each a new agentId is produced when a new agency version is created,
    but the new version of the agent shares the same versionId as the original agent.
    For a given agencyId, there is only one agent with a given versionId.
  * */
  static async getLatestInAgency(
    agencyConversationId: string,
    agencyId: number,
    agentVersionId: number,
  ): Promise<?AgentConversationSQL> {
    const sql = sqltag`
      SELECT *
      FROM ${Config.dbPrefix}_AgentConversation
      WHERE agencyConversationId = UNHEX(${agencyConversationId}) 
      AND agentId IN (
        SELECT agentId
        FROM ${Config.dbPrefix}_Agent
        WHERE versionId = ${agentVersionId}
        AND agentId = ${agencyId}
        ORDER BY dateCreated DESC
        LIMIT 1
      )
      AND isDeleted = FALSE;
    `
    const rows = await database.query(sql)
    return rows[0]
  }

  static async getManager(
    agencyId: number,
    agencyConversationId: string,
  ): Promise<?AgentConversationSQL> {
    // There should be only one agentConversation per agency within an agencyConversation.
    const query = sqltag`
      SELECT agentConversation.*
      FROM ${Config.dbPrefix}_AgentConversation agentConversation
      LEFT JOIN ${Config.dbPrefix}_Agent agent
      ON agentConversation.agentId = agent.agentId
      LEFT JOIN ${Config.dbPrefix}_AgencyConversation agencyConversation
      ON agentConversation.agencyConversationId = agencyConversation.agencyConversationId
      WHERE agentConversation.agencyConversationId = UNHEX(${agencyConversationId})
      AND agent.isManager = TRUE
      AND agencyConversation.agencyId = ${agencyId};
    `
    const rows = await database.query(query)
    return rows[0]
  }

  static async getAll(
    agencyConversationId: string,
  ): Promise<Array<AgentConversationSQL>> {
    const query = sqltag`
      SELECT *
      FROM ${Config.dbPrefix}_AgentConversation
      WHERE agencyConversationId = UNHEX(${agencyConversationId})
      AND isDeleted = FALSE;
    `
    const rows = await database.query(query)
    return rows
  }

  static async getAllOwned(
    agencyConversationId: string,
    userId: string,
  ): Promise<Array<AgentConversationSQL>> {
    const query = sqltag`
      SELECT agentConversation.*
      FROM ${Config.dbPrefix}_AgentConversation agentConversation
      LEFT JOIN ${Config.dbPrefix}_AgencyConversation agencyConversation
      ON agentConversation.agencyConversationId = agencyConversation.agencyConversationId
      LEFT JOIN ${Config.dbPrefix}_Agency agency
      ON agencyConversation.agencyId = agency.agencyId
      WHERE agentConversation.isDeleted = FALSE
      AND agencyConversation.isDeleted = FALSE
      AND agency.isDeleted = FALSE
      AND agencyConversation.agencyConversationId = UNHEX(${agencyConversationId})
      AND agency.userId = UNHEX(${userId});
    `
    const rows = await database.query(query)
    return rows
  }

  static async insert(
    agencyConversationId: string,
    agentId: number,
  ): Promise<string> {
    const agentConversationId = ID.getUnique()
    const sql = sqltag`
      INSERT INTO ${Config.dbPrefix}_AgentConversation (
        agentConversationId,
        agencyConversationId,
        agentId
      ) VALUES (
        UNHEX(${agentConversationId}),
        UNHEX(${agencyConversationId}),
        ${agentId}
      );
    `

    await database.query(sql)

    return agentConversationId
  }
}
