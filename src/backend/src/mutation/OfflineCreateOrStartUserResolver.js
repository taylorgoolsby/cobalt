// @flow

import gql from 'graphql-tag'
import { createPasswordToken } from '../utils/Token.js'
import UserInterface from '../schema/User/UserInterface.js'
import Security from '../utils/Security.js'

type OfflineCreateOrStartUserInput = {
  dummy?: ?string,
}

type OfflineCreateOrStartUserResponse = {
  success: boolean,
  passwordToken: string,
}

export const typeDefs: any = gql`
  input OfflineCreateOrStartUserInput {
    dummy: String
  }

  type OfflineCreateOrStartUserResponse {
    success: Boolean!
    passwordToken: String!
  }
`

/*
 * Called when the client clicks the "Start" button on the landing page.
 * This will either create a generic user if one does not exist in the database yet,
 * or it will find the existing user,
 * and it will return a passwordToken for that user.
 *
 * A passwordToken is JWT that represents a user has proven they know their password.
 * This token is passed to the client in case the user needs to provide multifactor authentication,
 * in which case the client must obtain any addition auth tokens.
 * The client will then pass all relevant auth tokens to the server via /getSessionToken.
 * This will exchange those auth tokens for a session token.
 * This pattern is used even for offline usage in order to reuse code that was initially designed for online usage.
 * */
export async function resolver(
  _: any,
  args: { input: OfflineCreateOrStartUserInput },
  ctx: any,
): Promise<OfflineCreateOrStartUserResponse> {
  const email = 'default@example.com'

  const existing = await UserInterface.getByEmail(email)

  let userId
  if (existing) {
    userId = existing.userId
  } else {
    const hashedPassword = await Security.hashPassword('the wizard of oz')
    userId = await UserInterface.insert('default@example.com', hashedPassword)
    await UserInterface.updateSettings(userId, {
      username: 'default',
    })
  }

  const passwordToken = await createPasswordToken(userId, email)

  return {
    success: true,
    passwordToken,
  }
}
