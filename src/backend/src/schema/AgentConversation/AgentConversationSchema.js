// @flow

import gql from 'graphql-tag'
import type { ResolverDefs } from '../../utils/resolver.js'
import resolver from '../../utils/resolver.js'
import type { MessageSQL } from '../Message/MessageSchema.js'
import MessageInterface from '../Message/MessageInterface.js'
import AgentInterface from '../Agent/AgentInterface.js'

export type AgentConversationSQL = {|
  agentConversationId: string,
  agencyConversationId: string,
  agentId: number,
  name: string,
  isDeleted: boolean,
  dateUpdated: string,
  dateCreated: string,
|}

export const typeDefs: any = gql`
  type AgentConversation {
    agentConversationId: String @sql(type: "BINARY(16)", primary: true)
    agencyConversationId: String @sql(type: "BINARY(16)", index: true)
    agentId: Int @sql(type: "INT", index: true)
    isDeleted: Boolean @sql(type: "BOOLEAN", default: "FALSE")
    dateUpdated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")

    id: String
    agent: Agent
    messages: [Message!]!
  }
`

export const resolvers: ResolverDefs = {
  AgentConversation: {
    id: resolver(async (agentConversation: AgentConversationSQL, args, ctx) => {
      return agentConversation.agentConversationId
    }),
    agent: resolver(async (agentConversation: AgentConversationSQL) => {
      const agent = await AgentInterface.get(agentConversation.agentId)
      return agent
    }),
    messages: resolver(
      async (
        agentConversation: AgentConversationSQL,
        args,
        ctx,
      ): Promise<Array<MessageSQL>> => {
        // todo: permission checking
        return MessageInterface.getNonSystem(
          agentConversation.agentConversationId,
        )
      },
    ),
  },
}
