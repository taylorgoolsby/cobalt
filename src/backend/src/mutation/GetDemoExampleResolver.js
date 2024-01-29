// @flow

import gql from 'graphql-tag'
import { unpackSession } from '../utils/Token.js'
import demoExample from '../demoExample.js'
import { resolver as getDemoSessionToken } from './GetDemoSessionTokenResolver.js'
import Config from 'common/src/Config.js'

type GetDemoExampleInput = {
  sessionToken: string,
  agencyId: number,
}

type GetDemoExampleResponse = {
  success: boolean,
  exampleHtml: string,
}

export const typeDefs: any = gql`
  input GetDemoExampleInput {
    sessionToken: String!
    agencyId: Int!
  }

  type GetDemoExampleResponse {
    success: Boolean!
    exampleHtml: String!
  }
`

export async function resolver(
  _: any,
  args: { input: GetDemoExampleInput },
  ctx: any,
): Promise<GetDemoExampleResponse> {
  const { sessionToken, agencyId } = args.input
  const session = await unpackSession(sessionToken, ctx)

  // Verifies user owns agencyId:
  const { demoSessionToken } = await getDemoSessionToken(
    null,
    {
      input: {
        sessionToken,
        agencyId,
      },
    },
    ctx,
  )

  const exampleHtml = demoExample(
    demoSessionToken,
    agencyId,
    Config.backendHost,
  )

  return {
    success: true,
    exampleHtml,
  }
}
