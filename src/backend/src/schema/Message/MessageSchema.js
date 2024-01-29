// @flow

import gql from 'graphql-tag'
import type { ResolverDefs } from '../../utils/resolver.js'
import resolver from '../../utils/resolver.js'
import toSqlEnum from '../../utils/toSqlEnum.js'

export const MessageRole = {
  SYSTEM: 'SYSTEM',
  ASSISTANT: 'ASSISTANT',
  USER: 'USER',
}

export type MessageRoleType = $Keys<typeof MessageRole>

export const MessageType = {
  GetToList: 'GetToList',
  ToList: 'ToList',
  GetResponse: 'GetResponse',
  Response: 'Response',
}

export type GetToListMessage = {
  type: 'GetToList',
  messages: Array<{ from: null | number, text: string }>,
}

export type ResponseMessage = {
  type: 'Response',
  text: string,
}

export type MessageData = {|
  internalInstruction?: ?boolean,
  userInstruction?: ?boolean,
  correctionInstruction?: ?boolean,
  toApi?: ?boolean,
  fromApi?: ?boolean,
  completed?: ?boolean,
  toAgentId?: ?number,
  fromAgentId?: ?number,
  text: string,

  __typename?: string,
  id?: string,
|}

export type MessageSQL = {|
  messageId: number,
  agentId: number,
  agentConversationId: string,
  role: MessageRoleType,
  linkedMessageId: ?number,
  data: MessageData,
  dateCreated: string,

  __typename?: string,
  id?: string,
|}

export type FlatMessage = {|
  messageId: number,
  agentId: number,
  agentConversationId: string,
  role: MessageRoleType,
  linkedMessageId: ?number,

  data?: ?MessageData,

  internalInstruction?: ?boolean,
  userInstruction?: ?boolean,
  correctionInstruction?: ?boolean,
  toApi?: ?boolean,
  fromApi?: ?boolean,
  completed?: ?boolean,
  toAgentId?: ?number,
  fromAgentId?: ?number,
  text: string,

  dateCreated: string,

  __typename?: string,
  id?: string,
|}

// todo:
//  We want the rendering of messages to be easy, so combining multiple messages into a single message is not good.
//  It makes it hard to parse in the client.
//  So if we have a case where multiple agents send a message to a target agent at the same time,
//  they will both start a new iteration for the target agent,
//  and if we debounce these iteration calls,
//  the target agent will send a single chat completion containing all the new messages,
//  but the database shows a separate message row for each message,
//  so the client will be able to easily render them.
//

export const typeDefs: any = gql`
  type MessageData {
    internalInstruction: Boolean
    userInstruction: Boolean
    correctionInstruction: Boolean
    toApi: Boolean
    fromApi: Boolean
    completed: Boolean
    toAgentId: Int
    fromAgentId: Int
    text: String
    
    id: String
  }
  
  type Message {
    messageId: Int @sql(primary: true, auto: true)
    agentId: Int @sql(type: "INT", index: true)
    agentConversationId: String @sql(type: "BINARY(16)", index: true)
    role: String @sql(type: "ENUM(${toSqlEnum(MessageRole)})")
    linkedMessageId: Int @sql(type: "INT", nullable: true)
    data: MessageData @sql(type: "JSON")
    dateUpdated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")

    id: String
  }
`

export const resolvers: ResolverDefs = {
  Message: {
    id: resolver(async (message: MessageSQL) => {
      return `Message:${message.messageId.toString()}`
    }),
    data: resolver(async (message: MessageSQL) => {
      message.data.id = 'MessageData:' + message.messageId
      return message.data
    }),
  },
  MessageData: {
    internalInstruction: resolver(async (messageData: MessageData) => {
      return !!messageData.internalInstruction
    }),
    userInstruction: resolver(async (messageData: MessageData) => {
      return !!messageData.userInstruction
    }),
    toApi: resolver(async (messageData: MessageData) => {
      return !!messageData.toApi
    }),
    fromApi: resolver(async (messageData: MessageData) => {
      return !!messageData.fromApi
    }),
    completed: resolver(async (messageData: MessageData) => {
      return !!messageData.completed
    }),
    toAgentId: resolver(async (messageData: MessageData) => {
      return messageData.toAgentId ?? null
    }),
    fromAgentId: resolver(async (messageData: MessageData) => {
      return messageData.fromAgentId ?? null
    }),
  },
}
