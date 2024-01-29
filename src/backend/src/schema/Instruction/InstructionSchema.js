// @flow

import gql from 'graphql-tag'
import type { ResolverDefs } from '../../utils/resolver.js'
import resolver from '../../utils/resolver.js'

export type InstructionSQL = {|
  instructionId: string,
  agentId: number,
  clause: string,
  orderIndex: number,
  canEdit: boolean,
  isInternal: boolean,
  isDeleted: boolean,
  dateUpdated: string,
  dateCreated: string,
|}

export const typeDefs: any = gql`
  type Instruction {
    instructionId: String @sql(type: "BINARY(16)", primary: true)
    agentId: Int @sql(type: "INT", index: true)
    clause: String @sql(type: "TEXT")
    orderIndex: Int @sql(type: "INT")
    canEdit: Boolean @sql(type: "BOOLEAN", default: "TRUE")
    isInternal: Boolean @sql(type: "BOOLEAN", default: "FALSE") @private
    isDeleted: Boolean @sql(type: "BOOLEAN", default: "FALSE")
    dateUpdated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")

    id: String
    #    blocks: [Block!]!
  }
`

export const resolvers: ResolverDefs = {
  Instruction: {
    id: resolver(async (instruction: InstructionSQL, args, ctx) => {
      return instruction.instructionId
    }),
    clause: resolver(async (instruction: InstructionSQL) => {
      if (instruction.isInternal) {
        // An redundant permission check.
        // Anything resolving an instruction should filter out internal instructions.
        return ''
      } else {
        return instruction.clause
      }
    }),
    // blocks: resolver(async (instruction: InstructionSQL, args, ctx) => {
    //   // todo: permissions
    //   return await BlockInterface.getAll(instruction.instructionId)
    // }),
  },
}
