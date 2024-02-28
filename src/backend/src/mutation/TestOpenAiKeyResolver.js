// @flow

import gql from 'graphql-tag'
import { unpackSession } from '../utils/Token.js'
import InferenceRest from '../rest/InferenceRest.js'

type TestOpenAiKeyInput = {
  sessionToken: string,
  openAiKey: string,
}

type TestOpenAiKeyResponse = {
  success: boolean,
}

export const typeDefs: any = gql`
  input TestOpenAiKeyInput {
    sessionToken: String!
    openAiKey: String!
  }

  type TestOpenAiKeyResponse {
    success: Boolean!
  }
`

export async function resolver(
  _: any,
  args: { input: TestOpenAiKeyInput },
  ctx: any,
): Promise<TestOpenAiKeyResponse> {
  const { sessionToken, openAiKey } = args.input
  const session = await unpackSession(sessionToken, ctx)

  if (openAiKey) {
    // If this call does not error out, then the key is good.
    const models = await InferenceRest.getAvailableModels(openAiKey)
  }

  return {
    success: true,
  }
}
