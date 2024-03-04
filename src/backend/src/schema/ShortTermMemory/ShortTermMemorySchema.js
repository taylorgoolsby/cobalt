// @flow

import gql from "graphql-tag";
import type {ResolverDefs} from "../../utils/resolver.js";
import resolver from "../../utils/resolver.js";
import type {GPTMessage} from "../../rest/InferenceRest.js";

export type ShortTermMemorySQL = {|
  shortTermMemoryId: number,
  agencyConversationId: string,
  model: string,
  inputs: Array<GPTMessage>,
  summary: string,
  dateCreated: string
|}

export const typeDefs: any = gql`
  type ShortTermMemory {
    shortTermMemoryId: Int @sql(primary: true, auto: true)
    agencyConversationId: String @sql(type: "BINARY(16)", index: true)
    model: String @sql(type: "VARCHAR(255)")
    inputs: JSON @sql(type: "JSON")
    summary: String @sql(type: "TEXT")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")

    id: String
  }
`

export const resolvers: ResolverDefs = {
  ShortTermMemory: {
    id: resolver(async (shortTermMemory: ShortTermMemorySQL) => {
      return `ShortTermMemory:${shortTermMemory.shortTermMemoryId.toString()}`
    }),
  }
}
