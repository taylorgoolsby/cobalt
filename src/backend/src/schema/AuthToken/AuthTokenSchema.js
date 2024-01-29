// @flow

import gql from 'graphql-tag'
import type { ResolverDefs } from '../../utils/resolver.js'
import resolver from '../../utils/resolver.js'

export type AuthTokenSQL = {|
  authTokenId: string,
  agencyVersionId: number,
  name: string,
  token: string,
  createdByUserId: string,
  dateDeleted: string,
  dateUpdated: string,
  dateCreated: string,
|}

export const typeDefs: any = gql`
  type AuthToken {
    authTokenId: String @sql(type: "BINARY(16)", primary: true)
    agencyVersionId: Int @sql(type: "INT", index: true)
    name: String @sql(type: "VARCHAR(170)", unicode: true)
    # The token is masked before returning to the client.
    token: String @sql(type: "VARCHAR(512)")
    createdByUserId: String @sql(type: "BINARY(16)")
    dateDeleted: String @sql(type: "TIMESTAMP", nullable: true)
    dateUpdated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")

    id: String
  }
`

export const resolvers: ResolverDefs = {
  AuthToken: {
    id: resolver(async (authKey: AuthTokenSQL) => {
      return authKey.authTokenId
    }),
    token: resolver(async (authToken: AuthTokenSQL) => {
      return (
        authToken.token.slice(0, -4).replaceAll(/./g, '•') +
        authToken.token.slice(-4)
      )
    }),
  },
}
