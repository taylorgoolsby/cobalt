// @flow

import type { ResolverDefs } from '../../utils/resolver.js'
import gql from 'graphql-tag'
import resolver from '../../utils/resolver.js'
import type { AgentSQL } from '../Agent/AgentSchema.js'
import AgentInterface from '../Agent/AgentInterface.js'
import AgencyConversationInterface from '../AgencyConversation/AgencyConversationInterface.js'
import AgencyInterface from './AgencyInterface.js'
import type { AgencyConversationSQL } from '../AgencyConversation/AgencyConversationSchema.js'

export type AgencySQL = {|
  agencyId: number,
  versionId: number,
  lookupId: string,
  userId: string,
  name: string,
  description: string,
  isPrivate: boolean,
  isDeleted: string,
  dateUpdated: string,
  dateCreated: string,
|}

export const typeDefs: any = gql`
  type Agency @id(from: ["agencyId"]) {
    agencyId: Int @sql(primary: true, auto: true)
    # The versionId is the agencyId of the first version of this agency.
    versionId: Int @sql(type: "INT", default: "0", index: true)
    lookupId: String @sql(type: "BINARY(16)", index: true)
    userId: String @sql(type: "BINARY(16)", index: true)
    name: String @sql(type: "VARCHAR(170)", unicode: true)
    description: String @sql(type: "TEXT", unicode: true)
    isPrivate: Boolean @sql(type: "BOOLEAN", default: "FALSE")
    isDeleted: Boolean @sql(type: "BOOLEAN", default: "FALSE")
    dateUpdated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")

    id: String
    agents: [Agent!]!
    agencyConversation(agencyConversationId: String): AgencyConversation
    # Conversations which appear in the AgencyInteract page. Does not include chats started via published API.
    debuggingConversations: [AgencyConversation!]!
    versions: [Agency!]!
  }
`

export const resolvers: ResolverDefs = {
  Agency: {
    id: resolver(async (agency: AgencySQL) => {
      return `Agency:${agency.agencyId.toString()}`
    }),
    agents: resolver(
      async (agency: AgencySQL, args, ctx): Promise<Array<AgentSQL>> => {
        if (ctx.session?.userId !== agency.userId) {
          // unauthorized
          return []
        }

        return AgentInterface.getAll(agency.agencyId)
      },
    ),
    agencyConversation: resolver(
      async (
        agency: AgencySQL,
        args: { agencyConversationId: ?string },
        ctx,
      ): Promise<?AgencyConversationSQL> => {
        if (!args.agencyConversationId) {
          return null
        }
        const conversation = await AgencyConversationInterface.get(
          agency.agencyId,
          args.agencyConversationId,
        )
        return conversation
      },
    ),
    debuggingConversations: resolver(
      async (
        agency: AgencySQL,
        args,
        ctx,
      ): Promise<Array<AgencyConversationSQL>> => {
        // todo: permission checking

        const conversations = await AgencyConversationInterface.getAll(
          agency.versionId,
        )
        return conversations
      },
    ),
    versions: resolver(
      async (agency: AgencySQL, args, ctx): Promise<Array<AgencySQL>> => {
        const versions = await AgencyInterface.getActiveVersions(
          agency.versionId,
        )
        return versions
      },
    ),
  },
}
