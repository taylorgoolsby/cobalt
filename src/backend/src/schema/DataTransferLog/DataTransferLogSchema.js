// @flow

import type { ResolverDefs } from '../../utils/resolver.js'
import gql from 'graphql-tag'
import resolver from '../../utils/resolver.js'

export type DataTransferLogSQL = {
  dataTransferLogId: string,
  // Each API request should have some kind of userId encoded in the header.
  clientId: string,
  // IN and OUT entries are related together by a unique requestId
  // which is generated when a connection is first opened.
  // A single connection can keep-alive,
  // and since multiple requests and responses can be made on a single connection,
  // there might be multiple operations of the same type sharing the same connectionId.
  // The total bytes sent or received by a connection can be found by grouping by connectionId.
  connectionId: string,
  // In order to find the total bytes per request, instead of per connection,
  // a requestId is assigned per request.
  requestId: string,
  operation: string,
  bytesLength: string,
  dateCreated: string,
}

export const typeDefs: any = gql`
  type DataTransferLog {
    dataTransferLogId: String @sql(type: "BINARY(16)", primary: true)
    clientId: String @sql(type: "BINARY(16)", index: true)
    connectionId: String @sql(type: "BINARY(16)", index: true)
    requestId: String @sql(type: "BINARY(16)", index: true)
    bytesIn: Int @sql(type: "INT")
    bytesOut: Int @sql(type: "INT")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")

    id: String
  }
`

export const resolvers: ResolverDefs = {
  DataTransferLog: {
    id: resolver(async (obj: DataTransferLogSQL, args, context, info) => {
      return obj.dataTransferLogId
    }),
  },
}
