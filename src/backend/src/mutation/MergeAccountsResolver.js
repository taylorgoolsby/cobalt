// @flow

import gql from 'graphql-tag'
import { createSessionToken, unpackSession } from '../utils/Token.js'
import UserInterface from '../schema/User/UserInterface.js'

type MergeAccountsInput = {
  currentSessionToken: string,
  previousSessionToken: string,
}

type MergeAccountsResponse = {
  success: boolean,
  finalSessionToken?: string,
  errorAlreadyMerged?: boolean,
}

export const typeDefs: any = gql`
  input MergeAccountsInput {
    currentSessionToken: String!
    previousSessionToken: String!
  }

  type MergeAccountsResponse {
    success: Boolean!
    finalSessionToken: String
    errorAlreadyMerged: Boolean
  }
`

export async function resolver(
  _: any,
  args: { input: MergeAccountsInput },
  ctx: any,
): Promise<MergeAccountsResponse> {
  const { currentSessionToken, previousSessionToken } = args.input

  const currentSession = await unpackSession(currentSessionToken, {})
  const previousSession = await unpackSession(previousSessionToken, {})

  if (currentSession.userId === previousSession.userId) {
    return {
      success: false,
      errorAlreadyMerged: true,
    }
  }

  const currentExistingUser = await UserInterface.getUser(currentSession.userId)
  const previousExistingUser = await UserInterface.getUser(
    previousSession.userId,
  )

  if (!currentExistingUser) {
    throw new Error('currentExistingUser does not exist')
  }
  if (!previousExistingUser) {
    throw new Error('previousExistingUser does not exist')
  }

  if (
    currentExistingUser.combinedUserId === previousExistingUser.combinedUserId
  ) {
    return {
      success: false,
      errorAlreadyMerged: true,
    }
  }

  await UserInterface.updateCombinedUserId(
    currentExistingUser.userId,
    previousExistingUser.combinedUserId,
  )

  const allUsers = await UserInterface.getMultiAccounts(
    previousExistingUser.userId,
  )
  const sessionToken = await createSessionToken(allUsers[0].userId)

  return {
    success: true,
    finalSessionToken: sessionToken,
  }
}
