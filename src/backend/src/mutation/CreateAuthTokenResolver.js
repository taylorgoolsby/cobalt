// @flow

import gql from 'graphql-tag'
import { unpackSessionToken } from '../utils/Token.js'
import AgencyInterface from '../schema/Agency/AgencyInterface.js'
import AuthTokenInterface from '../schema/AuthToken/AuthTokenInterface.js'
import type { UserSQL } from '../schema/User/UserSchema.js'
import nonMaybe from 'non-maybe'
import UserInterface from '../schema/User/UserInterface.js'
import Config from 'common/src/Config.js'

type CreateAuthTokenInput = {
  sessionToken: string,
  agencyId: number,
  name: string,
}

type CreateAuthTokenResponse = {
  success: boolean,
  unmaskedToken: string,
  user: UserSQL,
}

export const typeDefs: any = gql`
  input CreateAuthTokenInput {
    sessionToken: String!
    agencyId: Int!
    name: String!
  }

  type CreateAuthTokenResponse {
    success: Boolean!
    unmaskedToken: String!
    user: User!
  }
`

export async function resolver(
  _: any,
  args: { input: CreateAuthTokenInput },
  ctx: any,
): Promise<CreateAuthTokenResponse> {
  const { sessionToken, agencyId, name } = args.input
  const session = await unpackSessionToken(sessionToken, ctx)

  // Verify that the agency exists and that the user owns it
  const agency = await AgencyInterface.getOwned(agencyId, session.userId)
  if (!agency) {
    throw new Error('Unauthorized')
  }

  const user = await UserInterface.getUser(session.userId)
  if (!user) {
    throw new Error('Unauthorized')
  }

  const isTrialKey = user.openAiKey === Config.openAiPublicTrialKey
  if (isTrialKey) {
    throw new Error(
      'When using the trial key, you cannot use the publish API with permanent keys.',
    )
  }

  // Create the token
  const { token } = await AuthTokenInterface.insert(
    agency.versionId,
    name,
    session.userId,
  )

  return {
    success: true,
    unmaskedToken: token,
    user: nonMaybe(await UserInterface.getUser(session.userId)),
  }
}
