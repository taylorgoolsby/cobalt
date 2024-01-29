// @flow

import { sqltag } from 'common/sql-template-tag'
import Config from 'common/src/Config.js'
import database from '../../mysql/database.js'
import type {BlockSQL} from "./BlockSchema.js";

export default class BlockInterface {
  static async getAll(instructionId: string): Promise<Array<BlockSQL>> {
    const sql = sqltag`
      SELECT * 
      FROM ${Config.dbPrefix}_Block
      WHERE conversationId = UNHEX(${instructionId})
      ORDER BY ordering ASC;
    `
    const rows = await database.query(sql)
    return rows
  }
}