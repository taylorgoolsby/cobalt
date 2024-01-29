// @flow

import type { AgentSQL } from './AgentSchema.js'
import { sqltag, join } from 'common/sql-template-tag'
import Config from 'common/src/Config.js'
import database from '../../mysql/database.js'
import InstructionInterface from '../Instruction/InstructionInterface.js'

export default class AgentInterface {
  static async get(agentId: number): Promise<?AgentSQL> {
    const sql = sqltag`
      SELECT * 
      FROM ${Config.dbPrefix}_Agent
      WHERE agentId = ${agentId}
      AND isDeleted = FALSE;
    `
    const rows = await database.query(sql)
    return rows[0]
  }

  static async getLatestInAgency(
    agencyId: number,
    agentVersionId: number,
  ): Promise<?AgentSQL> {
    const sql = sqltag`
      SELECT * 
      FROM ${Config.dbPrefix}_Agent
      WHERE versionId = ${agentVersionId}
      AND agencyId = ${agencyId}
      AND isDeleted = FALSE
      ORDER BY dateCreated DESC
      LIMIT 1;
    `
    const rows = await database.query(sql)
    return rows[0]
  }

  static async getManager(agencyId: number): Promise<?AgentSQL> {
    const sql = sqltag`
      SELECT * 
      FROM ${Config.dbPrefix}_Agent
      WHERE agencyId = ${agencyId}
      AND isDeleted = FALSE
      AND isManager = TRUE;
    `
    const rows = await database.query(sql)
    return rows[0]
  }

  static async getAll(agencyId: number): Promise<Array<AgentSQL>> {
    const sql = sqltag`
      SELECT * 
      FROM ${Config.dbPrefix}_Agent
      WHERE agencyId = ${agencyId}
      AND isDeleted = FALSE
      ORDER BY orderIndex DESC;
    `
    const rows = await database.query(sql)
    return rows
  }

  static async insert(
    agencyId: number,
    model: string,
    name: string,
    orderIndex: number,
  ): Promise<number> {
    const sql = sqltag`
      INSERT INTO ${Config.dbPrefix}_Agent 
      (
        agencyId, 
        model, 
        name,
        orderIndex
      ) VALUES (
        ${agencyId}, 
        ${model}, 
        ${name},
        ${orderIndex}
      );
    `
    const res = await database.query(sql)

    const agentId = res.insertId

    // The first time an agent is created, it is its own version.
    const updateQuery = sqltag`
      UPDATE ${Config.dbPrefix}_Agent SET
      versionId = ${agentId},
      dateUpdated = CURRENT_TIMESTAMP
      WHERE agentId = ${agentId};
    `
    await database.query(updateQuery)

    return agentId
  }

  static async clone(agencyId: number, agent: AgentSQL): Promise<number> {
    // When cloning an agent, the versionId is copied over.
    const sql = sqltag`
      INSERT INTO ${Config.dbPrefix}_Agent 
      (
        agencyId, 
        versionId,
        model, 
        name,
        orderIndex,
        isManager,
        isDeleted
      ) VALUES (
        ${agencyId}, 
        ${agent.versionId},
        ${agent.model}, 
        ${agent.name},
        ${agent.orderIndex},
        ${agent.isManager},
        ${agent.isDeleted}
      );
    `
    const res = await database.query(sql)

    const agentId = res.insertId

    const agentInstructions = await InstructionInterface.getAll(agent.agentId, {
      includeInternal: true,
    })
    await InstructionInterface.insertBatch(agentId, agentInstructions)

    return agentId
  }

  static async updateIsManager(
    agentId: number,
    isManager: boolean,
  ): Promise<any> {
    const sql = sqltag`
      UPDATE ${Config.dbPrefix}_Agent
      SET
        isManager = ${isManager},
        dateUpdated = CURRENT_TIMESTAMP
      WHERE agentId = ${agentId};
    `
    await database.query(sql)
  }

  static async update(
    agentId: number,
    name: string,
    model: string,
    orderIndex: number,
  ): Promise<any> {
    const sql = sqltag`
      UPDATE ${Config.dbPrefix}_Agent
      SET
        name = ${name},
        model = ${model},
        orderIndex = ${orderIndex},
        dateUpdated = CURRENT_TIMESTAMP
      WHERE agentId = ${agentId};
    `
    await database.query(sql)
  }

  // agentIds and orderIndicies are parallel arrays
  // agents are ordered DESC, so the new orderings must be in reverse order.
  static async updateOrdering(
    agencyId: number,
    agentIds: Array<number>,
  ): Promise<void> {
    if (!agentIds.length) return

    const sql = sqltag`
      UPDATE ${Config.dbPrefix}_Agent
      SET
        orderIndex = CASE agentId
          ${join(
            agentIds.map(
              (agentId, i) =>
                sqltag`WHEN ${agentId} THEN ${agentIds.length - 1 - i}`,
            ),
            '\n',
          )}
        END,
        dateUpdated = CURRENT_TIMESTAMP
      WHERE agencyId = ${agencyId}
      AND NOT isDeleted;
    `

    await database.query(sql)
  }

  static async delete(agentId: number): Promise<any> {
    const sql = sqltag`
      UPDATE ${Config.dbPrefix}_Agent SET
      isDeleted = TRUE,
      dateUpdated = CURRENT_TIMESTAMP
      WHERE agentId = ${agentId};
    `
    await database.query(sql)
  }
}
