// @flow

import { sqltag, join } from 'common/sql-template-tag'
import Config from 'common/src/Config.js'
import database from '../../mysql/database.js'
import type {
  MessageData,
  MessageSQL,
  MessageRoleType,
} from './MessageSchema.js'
import { MessageRole } from './MessageSchema.js'

export default class MessageInterface {
  // Get all messages for the given agentIds
  static async getUnderBatch(
    agentIds: Array<number>,
  ): Promise<Array<MessageSQL>> {
    if (!agentIds.length) return []

    const sql = sqltag`
      SELECT * 
      FROM ${Config.dbPrefix}_Message
      WHERE agentId IN (${join(agentIds.map((id) => sqltag`${id}`))})
      ORDER BY messageId ASC;
    `
    const rows = await database.query(sql)
    return rows
  }

  static async getAll(agentConversationId: string): Promise<Array<MessageSQL>> {
    const sql = sqltag`
      SELECT * 
      FROM ${Config.dbPrefix}_Message
      WHERE agentConversationId = UNHEX(${agentConversationId})
      ORDER BY messageId ASC;
    `
    const rows = await database.query(sql)
    return rows
  }

  static async getByRole(
    agentConversationId: string,
    role: MessageRoleType,
  ): Promise<Array<MessageSQL>> {
    const sql = sqltag`
      SELECT * 
      FROM ${Config.dbPrefix}_Message
      WHERE agentConversationId = UNHEX(${agentConversationId})
      AND role = ${role}
      ORDER BY messageId ASC;
    `
    const rows = await database.query(sql)
    return rows
  }

  static async getNonSystem(
    agentConversationId: string,
  ): Promise<Array<MessageSQL>> {
    const sql = sqltag`
      SELECT * 
      FROM ${Config.dbPrefix}_Message
      WHERE agentConversationId = UNHEX(${agentConversationId})
      AND role != ${MessageRole.SYSTEM}
      ORDER BY messageId ASC;
    `
    const rows = await database.query(sql)
    return rows
  }

  static async insert(
    agentId: number,
    agentConversationId: string,
    role: MessageRoleType,
    data: MessageData,
  ): Promise<MessageSQL> {
    // messageId does not matter before insert since it will be removed from insertedData:
    const normalizedData = normalizeMessageData(0, data)

    const insertedData: MessageData = {
      ...normalizedData,
      // Only ASSISTANT messages start out as incomplete.
      completed: role === MessageRole.SYSTEM || role === MessageRole.USER,
    }
    delete insertedData.id
    delete insertedData.__typename

    const query = sqltag`
      INSERT INTO ${Config.dbPrefix}_Message (
        agentId,
        agentConversationId,
        role,
        data
      ) VALUES (
        ${agentId},
        UNHEX(${agentConversationId}),
        ${role},
        ${JSON.stringify(insertedData)}
      );
    `

    const res = await database.query(query)

    const messageId = res.insertId

    const messageTemplate: MessageSQL = {
      __typename: 'Message',
      id: messageId.toString(),
      messageId,
      agentId,
      agentConversationId,
      role,
      linkedMessageId: null,
      data: normalizeMessageData(messageId, insertedData),
      dateCreated: new Date().toISOString(),
    }

    return messageTemplate
  }

  static async completeData(
    messageId: number,
    data: MessageData,
  ): Promise<any> {
    const normalized = normalizeMessageData(messageId, data)

    const insertedData = {
      ...normalized,
      completed: true,
    }
    delete insertedData.id
    delete insertedData.__typename

    const query = sqltag`
      UPDATE ${Config.dbPrefix}_Message SET
        data = ${JSON.stringify(insertedData)},
        dateUpdated = CURRENT_TIMESTAMP
      WHERE messageId = ${messageId};
    `
    await database.query(query)
  }

  static async linkMessages(
    messageId1: number,
    messageId2: number,
  ): Promise<any> {
    let query = sqltag`
      UPDATE ${Config.dbPrefix}_Message SET
        linkedMessageId = CASE
          WHEN messageId = ${messageId1} THEN ${messageId2}
          WHEN messageId = ${messageId2} THEN ${messageId1}
        END,
        dateUpdated = CURRENT_TIMESTAMP
      WHERE messageId IN (${messageId1}, ${messageId2});
    `
    await database.query(query)
  }
}

function normalizeMessageData(
  messageId: number,
  data: MessageData,
): MessageData {
  return {
    __typename: 'MessageData',
    id: 'MessageData:' + messageId,
    internalInstruction: false,
    userInstruction: false,
    toApi: false,
    fromApi: false,
    completed: false,
    toAgentId: null,
    fromAgentId: null,
    text: '',
    ...data,
  }
}
