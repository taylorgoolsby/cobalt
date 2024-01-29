// @flow

import { sqltag, join, raw } from 'common/sql-template-tag'
import Config from 'common/src/Config.js'
import database from '../../mysql/database.js'
import type { InstructionSQL } from './InstructionSchema.js'
import ID from '../../utils/ID.js'

export default class InstructionInterface {
  static async getAll(
    agentId: number,
    options?: { includeInternal?: ?boolean },
  ): Promise<Array<InstructionSQL>> {
    const sql = sqltag`
      SELECT * 
      FROM ${Config.dbPrefix}_Instruction
      WHERE agentId = ${agentId}
      AND isDeleted = FALSE
      ${raw(options?.includeInternal ? '' : 'AND isInternal = FALSE')}
      ORDER BY orderIndex ASC;
    `
    const rows = await database.query(sql)
    return rows
  }

  static async getAllInternalOnly(
    agentId: number,
  ): Promise<Array<InstructionSQL>> {
    const sql = sqltag`
      SELECT * 
      FROM ${Config.dbPrefix}_Instruction
      WHERE agentId = ${agentId}
      AND isDeleted = FALSE
      AND isInternal = TRUE
      ORDER BY orderIndex ASC;
    `
    const rows = await database.query(sql)
    return rows
  }

  static async insertBatch(
    agentId: number,
    instructions: Array<InstructionSQL>,
  ): Promise<Array<string>> {
    if (!instructions.length) {
      return []
    }

    const instructionIds = instructions.map(() => {
      return ID.getUnique()
    })

    const values = instructions.map(
      // Usage of agentId here prevent the user from attaching instructions to agents they don't own,
      // if the agentId has been verified for ownership.
      (instruction, i) => sqltag`(
        UNHEX(${instructionIds[i]}),
        ${agentId},
        ${instruction.clause},
        ${instruction.orderIndex},
        ${instruction.canEdit ?? true},
        ${instruction.isInternal}
      )`,
    )

    const sql = sqltag`
      INSERT INTO ${Config.dbPrefix}_Instruction
      (
        instructionId,
        agentId,
        clause,
        orderIndex,
        canEdit,
        isInternal
      ) VALUES
      ${join(values)};
    `

    await database.query(sql)

    return instructionIds
  }

  static async updateBatch(
    agentId: number,
    instructions: Array<InstructionSQL>,
  ): Promise<any> {
    if (!instructions.length) return

    // a single UPDATE sql statement to update all instructions using the CASE statement
    // this is faster than updating each instruction individually
    const sql = sqltag`
      UPDATE ${Config.dbPrefix}_Instruction SET
      clause = CASE instructionId
        ${join(
          instructions.map(
            (instruction) =>
              sqltag`WHEN UNHEX(${instruction.instructionId}) THEN ${instruction.clause}`,
          ),
          '\n',
        )}
      END,
      orderIndex = CASE instructionId
        ${join(
          instructions.map(
            (instruction) =>
              sqltag`WHEN UNHEX(${instruction.instructionId}) THEN ${instruction.orderIndex}`,
          ),
          '\n',
        )}
      END,
      dateUpdated = CURRENT_TIMESTAMP
      WHERE agentId = ${agentId}
      AND canEdit = TRUE
      AND instructionId IN (${join(
        instructions.map(
          (instruction) => sqltag`UNHEX(${instruction.instructionId})`,
        ),
      )});
    `
    await database.query(sql)
  }

  static async deleteBatch(
    agentId: number,
    instructions: Array<InstructionSQL>,
  ): Promise<any> {
    if (!instructions.length) return

    const instructionIds = instructions.map(
      (instruction) => sqltag`UNHEX(${instruction.instructionId})`,
    )

    const sql = sqltag`
      UPDATE ${Config.dbPrefix}_Instruction SET
      isDeleted = TRUE,
      dateUpdated = CURRENT_TIMESTAMP
      WHERE agentId = ${agentId} 
      AND instructionId IN (${join(instructionIds)})
      AND canEdit = TRUE;
    `
    await database.query(sql)
  }

  static async updateCanEdit(
    instructionId: string,
    canEdit: boolean,
  ): Promise<any> {
    const query = sqltag`
      UPDATE ${Config.dbPrefix}_Instruction SET
      canEdit = ${canEdit},
      dateUpdated = CURRENT_TIMESTAMP
      WHERE instructionId = UNHEX(${instructionId});
    `
    await database.query(query)
  }
}
