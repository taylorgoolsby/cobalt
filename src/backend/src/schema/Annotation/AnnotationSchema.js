// @flow

import gql from 'graphql-tag'
import type { ResolverDefs } from '../../utils/resolver.js'
import resolver from '../../utils/resolver.js'

export type AnnotationSQL = {
  annotationId: number,
  messageId: number,
  text: string,
  embedding: Array<number>,
  dateCreated: string,
}

export const typeDefs: any = gql`
  type Annotation {
    annotationId: Int @sql(primary: true)
    messageId: Int @sql(type: "INT", index: true)
    text: String @sql(type: "TEXT", unicode: true)
    embedding: JSON @sql(type: "JSON")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")

    id: String
  }
`

export const resolvers: ResolverDefs = {
  Annotation: {
    id: resolver(async (annotation: AnnotationSQL) => {
      return `Annotation:${annotation.annotationId.toString()}`
    }),
  },
}
