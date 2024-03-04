// @flow

import { sqltag, join } from 'common/sql-template-tag'
import Config from 'common/src/Config.js'
import database from '../../mysql/database.js'
import type {GPTMessage} from "../../rest/InferenceRest.js";

export default class ShortTermMemoryInterface {
  static async getLast(agencyConversationId: string): Promise<?string> {
    const query = sqltag`
      SELECT * FROM ${Config.dbPrefix}_ShortTermMemory
      WHERE agencyConversationId = UNHEX(${agencyConversationId})
      ORDER BY id DESC
      LIMIT 1;
    `

    const rows = await database.query(query)

    return rows[0]?.summary
  }

  static async insert(agencyConversationId: string, model: string, inputs: Array<GPTMessage>, summary: string): Promise<number> {
    const query = sqltag`
      INSERT INTO ${Config.dbPrefix}_ShortTermMemory (
        agencyConversationId,
        model,
        inputs,
        summary
      ) VALUES (
        UNHEX(${agencyConversationId}),
        ${model},
        ${JSON.stringify(inputs)},
        ${summary}
      );
    `

    const res = await database.query(query)

    const shortTermMemoryId = res.insertId

    return shortTermMemoryId
  }
}