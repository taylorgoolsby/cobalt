// @flow

import gql from 'graphql-tag'
import type { ResolverDefs } from '../../utils/resolver.js'
import resolver from '../../utils/resolver.js'
import type { InstructionSQL } from '../Instruction/InstructionSchema.js'
import InstructionInterface from '../Instruction/InstructionInterface.js'

export type AgentSQL = {|
  agentId: number,
  versionId: number,
  agencyId: number,
  name: string,
  model: string,
  orderIndex: number,
  referenceId: number,
  isManager: boolean,
  isDeleted: boolean,
  dateUpdated: string,
  dateCreated: string,
|}

export const typeDefs: any = gql`
  type Agent {
    agentId: Int @sql(primary: true, auto: true)
    # The versionId is copied over when a new agency version is created.
    # When a new agent is created, it's versionId is set to its agentId.
    # agentId changes between versions, but versionId does not.
    # This is used for FlipMove animations.
    versionId: Int @sql(type: "INT", default: "0", index: true)
    agencyId: Int @sql(type: "INT", index: true)
    name: String @sql(type: "VARCHAR(170)", unicode: true)
    model: String @sql(type: "VARCHAR(170)", nullable: true)
    orderIndex: Int @sql(type: "INT")
    isManager: Boolean @sql(type: "BOOLEAN", default: "FALSE")
    isDeleted: Boolean @sql(type: "BOOLEAN", default: "FALSE")
    dateUpdated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")

    id: String
    referenceId: Int
    instructions: [Instruction!]!
  }
`

export const resolvers: ResolverDefs = {
  Agent: {
    id: resolver(async (agent: AgentSQL) => {
      return `Agent:${agent.agentId.toString()}`
    }),
    referenceId: resolver(async (agent: AgentSQL) => {
      return agent.versionId
    }),
    instructions: resolver(
      async (agent: AgentSQL, args, ctx): Promise<Array<InstructionSQL>> => {
        // agency.agents should already have permission checking,
        // and there should be no other way to get an agent except through agency.agents.

        // Does not include internal instructions:
        const instructions = await InstructionInterface.getAll(agent.agentId)
        return instructions
      },
    ),
  },
}
