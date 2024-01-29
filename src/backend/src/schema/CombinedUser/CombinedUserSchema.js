// @flow

import type { ResolverDefs } from '../../utils/resolver.js'
import gql from 'graphql-tag'

export type CombinedUserSQL = {
  combinedUserId: string,
  dateUpdated: string,
  dateCreated: string,
}

export const typeDefs: any = gql`
  type CombinedUser @private {
    combinedUserId: String @sql(type: "BINARY(16)", primary: true)
    dateUpdated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")

    id: String
  }
`

export const resolvers: ResolverDefs = {
  CombinedUser: {},
}
