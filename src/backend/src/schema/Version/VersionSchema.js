// @flow

import type { ResolverDefs } from '../../utils/resolver.js'
import gql from 'graphql-tag'

// todo: generate types from graphql.
export type VersionSQL = {
  version: string,
  stage: string,
  isMigrated: boolean,
  dateUpdated: string,
  dateCreated: string,
}

/*
    """
    runtimeEnv does not need an index because there should only be a
    small number of environments per version.
    """
* */

export const typeDefs: any = gql`
  type Version {
    version: String @sql(type: "VARCHAR(10)", primary: true)
    stage: String @sql(type: "VARCHAR(30)", primary: true)
    isMigrated: Boolean @sql(default: "FALSE")
    migrationScript: String @sql(type: "MEDIUMTEXT", nullable: true)
    dateUpdated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
  }
`

export const resolvers: ResolverDefs = {
  Version: {},
}
