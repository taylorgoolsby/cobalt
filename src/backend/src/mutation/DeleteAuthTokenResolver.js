// @flow

import gql from 'graphql-tag'
import { unpackSession } from '../utils/Token.js'
import AuthTokenInterface from '../schema/AuthToken/AuthTokenInterface.js'
import AgencyInterface from '../schema/Agency/AgencyInterface.js'
import type { UserSQL } from '../schema/User/UserSchema.js'
import UserInterface from '../schema/User/UserInterface.js'
import nonMaybe from 'non-maybe'

type DeleteAuthTokenInput = {
  sessionToken: string,
  authTokenId: string,
}

type DeleteAuthTokenResponse = {
  success: boolean,
  user: UserSQL,
}

export const typeDefs: any = gql`
  input DeleteAuthTokenInput {
    sessionToken: String!
    authTokenId: String!
  }

  type DeleteAuthTokenResponse {
    success: Boolean!
    user: User!
  }
`

export async function resolver(
  _: any,
  args: { input: DeleteAuthTokenInput },
  ctx: any,
): Promise<DeleteAuthTokenResponse> {
  const { sessionToken, authTokenId } = args.input
  const session = await unpackSession(sessionToken, ctx)

  // Verify the user owns the auth token

  const authToken = await AuthTokenInterface.getActive(authTokenId)
  if (!authToken) {
    throw new Error('Unauthorized')
  }

  const agencies = await AgencyInterface.getActiveVersions(
    authToken.agencyVersionId,
  )
  if (!agencies.length) {
    throw new Error('Unauthorized')
  }

  // Here, it is assumed that all agencies sharing a version also share the same userId because of the cloning process.
  if (!agencies[0].userId === session.userId) {
    throw new Error('Unauthorized')
  }

  await AuthTokenInterface.softDelete(authTokenId)

  return {
    success: true,
    user: nonMaybe(await UserInterface.getUser(session.userId)),
  }
}
