// @flow

import gql from "graphql-tag";
import type {ResolverDefs} from "../../utils/resolver.js";
import resolver from "../../utils/resolver.js";
import toSqlEnum from '../../utils/toSqlEnum.js'
import type {GPTMessage} from "../../rest/InferenceRest.js";

export const CompletionType = {
  GENERAL: 'GENERAL',
  SHORT_TERM_MEMORY: 'SHORT_TERM_MEMORY',
  LONG_TERM_MEMORY: 'LONG_TERM_MEMORY',
}

export type CompletionTypeEnum = $Keys<typeof CompletionType>

export type CompletionSQL = {
  completionId: number,
  agencyConversationId: string,
  type: CompletionTypeEnum,
  model: string,
  inputs: Array<GPTMessage>,
  output: GPTMessage,
  dateCreated: string
}

export const typeDefs: any = gql`
  type Completion {
    completionId: Int @sql(primary: true, auto: true)
    agencyConversationId: String @sql(type: "BINARY(16)", index: true)
    type: String @sql(type: "ENUM(${toSqlEnum(CompletionType)})")
    model: String @sql(type: "VARCHAR(255)")
    inputs: JSON @sql(type: "JSON")
    output: JSON @sql(type: "JSON")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")

    id: String
  }
`

export const resolvers: ResolverDefs = {
  Completion: {
    id: resolver(async (completion: CompletionSQL) => {
      return `Completion:${completion.completionId.toString()}`
    }),
  }
}
