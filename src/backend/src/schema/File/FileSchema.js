// @flow

import type { ResolverDefs } from '../../utils/resolver.js'
import gql from 'graphql-tag'
import resolver from '../../utils/resolver.js'

export type FileSQL = {
  fileId: string,
  storedName: string,
  metadata: { [string]: any },
  dateUpdated: string,
  dateCreated: string,
}

export const typeDefs: any = gql`
  type File {
    fileId: String @sql(type: "BINARY(16)", primary: true)
    storedName: String @sql(type: "VARCHAR(100)")
    metadata: JSON @sql(type: "JSON")
    dateUpdated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")

    id: String
  }
`

export const resolvers: ResolverDefs = {
  File: {
    id: resolver(async (file: FileSQL) => {
      return file.fileId
    }),
  },
}
