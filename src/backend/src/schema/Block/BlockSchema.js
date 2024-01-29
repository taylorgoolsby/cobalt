// @flow

import gql from 'graphql-tag'
import type { ResolverDefs } from '../../utils/resolver.js'
import resolver from '../../utils/resolver.js'
import toSqlEnum from '../../utils/toSqlEnum.js'

export type BlockSQL = {|
  blockId: string,
  instructionId: string,
  type: string,
  data: string,
  dateUpdated: string,
  dateCreated: string,
|}

export const BlockType = {
  FREEFORM: 'FREEFORM',
  TO: 'TO',
  FROM: 'FROM',
}

export const typeDefs: any = gql`
  type Block {
    blockId: String @sql(type: "BINARY(16)", primary: true)
    instructionId: String @sql(type: "BINARY(16)", index: true)
    type: String @sql(type: "ENUM(${toSqlEnum(BlockType)})")
    data: JSON @sql(type: "JSON")
    ordering: Int @sql(type: "INT")
    dateUpdated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")

    id: String
  }
`

export const resolvers: ResolverDefs = {
  Block: {
    id: resolver(async (block: BlockSQL) => {
      return block.blockId
    }),
  },
}
