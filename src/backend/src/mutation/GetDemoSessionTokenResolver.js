// @flow

import gql from 'graphql-tag'
import { createDemoSessionToken, unpackSessionToken } from '../utils/Token.js'
import AgencyInterface from '../schema/Agency/AgencyInterface.js'

type GetDemoSessionTokenInput = {
  sessionToken: string,
  agencyId: number,
}

type GetDemoSessionTokenResponse = {
  success: boolean,
  demoSessionToken: string,
}

export const typeDefs: any = gql`
  input GetDemoSessionTokenInput {
    sessionToken: String!
    agencyId: Int!
  }

  type GetDemoSessionTokenResponse {
    success: Boolean!
    demoSessionToken: String!
  }
`

export async function resolver(
  _: any,
  args: { input: GetDemoSessionTokenInput },
  ctx: any,
): Promise<GetDemoSessionTokenResponse> {
  const { sessionToken, agencyId } = args.input
  const session = await unpackSessionToken(sessionToken, ctx)

  if (!agencyId || typeof agencyId !== 'number') {
    throw new Error('agencyId must be a number')
  }

  // Verify user owns agencyId
  const agency = await AgencyInterface.getOwned(agencyId, session.userId)
  if (!agency) {
    throw new Error('Unauthorized')
  }

  const demoSessionToken = await createDemoSessionToken(
    session.userId,
    agencyId,
  )

  return {
    success: true,
    demoSessionToken,
  }
}
