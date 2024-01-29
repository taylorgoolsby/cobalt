// @flow

import gql from 'graphql-tag'
import type { ResolverDefs } from '../../utils/resolver.js'
import resolver from '../../utils/resolver.js'
import type { AgentConversationSQL } from '../AgentConversation/AgentConversationSchema.js'
import AgentConversationInterface from '../AgentConversation/AgentConversationInterface.js'

export type AgencyConversationSQL = {|
  agencyConversationId: string, // You may see chatId as a synonym.
  agencyId: number,
  name: string,
  startedByUserId: string,
  isDeleted: boolean,
  dateUpdated: string,
  dateCreated: string,
|}

export const typeDefs: any = gql`
  type AgencyConversation {
    agencyConversationId: String @sql(type: "BINARY(16)", primary: true)
    agencyId: Int @sql(type: "INT", index: true)
    name: String @sql(type: "VARCHAR(170)", unicode: true)
    startedByUserId: String @sql(type: "BINARY(16)")
    isDeleted: Boolean @sql(type: "BOOLEAN", default: "FALSE")
    dateUpdated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")

    id: String
    managerConversation: AgentConversation
    agentConversations: [AgentConversation!]!
    #    messages: [Message!]!
  }
`

export const resolvers: ResolverDefs = {
  AgencyConversation: {
    id: resolver(
      async (agencyConversation: AgencyConversationSQL, args, ctx) => {
        return agencyConversation.agencyConversationId
      },
    ),
    managerConversation: resolver(
      async (
        agencyConversation: AgencyConversationSQL,
      ): Promise<?AgentConversationSQL> => {
        const conversation = await AgentConversationInterface.getManager(
          agencyConversation.agencyId,
          agencyConversation.agencyConversationId,
        )
        return conversation
      },
    ),
    agentConversations: resolver(
      async (
        agencyConversation: AgencyConversationSQL,
      ): Promise<Array<AgentConversationSQL>> => {
        const conversations = await AgentConversationInterface.getAll(
          agencyConversation.agencyConversationId,
        )
        return conversations
      },
    ),
  },
}
