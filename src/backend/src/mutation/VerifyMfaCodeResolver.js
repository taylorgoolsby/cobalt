// @flow

import gql from 'graphql-tag'
import Security from '../utils/Security.js'

type VerifyMfaCodeInput = {
  userId: string,
  code: string,
}

type VerifyMfaCodeResponse = {
  success: boolean,
  mfaToken: string,
}

export const typeDefs: any = gql`
  input VerifyMfaCodeInput {
    userId: String!
    code: String!
  }

  type VerifyMfaCodeResponse {
    success: Boolean!
    mfaToken: String!
  }
`

export async function resolver(
  _: any,
  args: { input: VerifyMfaCodeInput },
  ctx: any,
): Promise<VerifyMfaCodeResponse> {
  const { userId, code } = args.input

  const mfaToken = await Security.verifyMfaCode(userId, code)

  return {
    success: true,
    mfaToken,
  }
}
