// @flow

import type { ResolverDefs } from '../../utils/resolver.js'
import gql from 'graphql-tag'
import toSqlEnum from '../../utils/toSqlEnum.js'
import resolver from '../../utils/resolver.js'

export type UsageLogSQL = {
  usageLogId: string,
  userId: string, // the account it belongs to
  operation: string,
  dateDeleted?: ?string, // Not part of schema. Produced from a JOIN. Included here for convenience.
  dateCreated: string,
}

export const operation = {
  SET: 'SET',
  GET: 'GET',
  DEL: 'DEL',
}

export type OperationEnum = $Keys<typeof operation>

/*
  Resources Cost:
  - How many bytes are stored.
  - How long those bytes are stored.

  Stored values have a default lifetime of 5 minutes,
  however, they may be manually erased by setting `"value": null`.
  In this case, the SET is paired with a DEL operation.

  If all SETs are paired with a DEL, then the lifetime of each key-value pair
  is calculated as the time difference between those two log entries.
* */

export const typeDefs: any = gql`
  type UsageLog {
    usageLogId: String @sql(type: "BINARY(16)", primary: true)
    userId: String @sql(type: "BINARY(16)", index: true)
    projectId: String @sql(type: "BINARY(16)", index: true)
    """
    For the GET operations, 
    it may be possible to query a key which does not exist,
    in which case, keyValuePairId is null.
    
    For DEL operations, the same is true.
    """
    keyValuePairId: String @sql(type: "BINARY(16)", index: true, nullable: true)
    operation: String @sql(type: "ENUM(${toSqlEnum(operation)})")
    keyByteLength: Int @sql(type: "INT")
    valueByteLength: Int @sql(type: "INT")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
    
    id: String
  }
`

export const resolvers: ResolverDefs = {
  UsageLog: {
    id: resolver(async (usageLog: UsageLogSQL) => {
      return usageLog.usageLogId
    }),
  },
}
