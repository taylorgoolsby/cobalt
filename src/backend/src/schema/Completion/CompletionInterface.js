// @flow

import { sqltag, join } from 'common/sql-template-tag'
import Config from 'common/src/Config.js'
import database from '../../mysql/database.js'
import type {GPTMessage} from "../../rest/InferenceRest.js";
import type {CompletionTypeEnum} from "./CompletionSchema.js";

export default class CompletionInterface {
  static async insert(agencyConversationId: string, type: CompletionTypeEnum, model: string, inputs: Array<GPTMessage>, output: GPTMessage): Promise<number> {
    const query = sqltag`
      INSERT INTO ${Config.dbPrefix}_Completion (
        agencyConversationId,
        type,
        model,
        inputs,
        output
      ) VALUES (
        UNHEX(${agencyConversationId}),
        ${type},
        ${model},
        ${JSON.stringify(inputs)},
        ${JSON.stringify(output)}
      );
    `

    const res = await database.query(query)

    const completionId = res.insertId

    return completionId
  }
}