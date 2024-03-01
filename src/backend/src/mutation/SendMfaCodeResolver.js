// @flow

import gql from 'graphql-tag'
import { unpackSessionToken } from '../utils/Token.js'
import Twilio from '../rest/Twilio.js'
import Security from '../utils/Security.js'
import MfaCodeEmail from '../email/templates/MfaCodeEmail.js'
import Email from '../rest/Email.js'

type SendMfaCodeInput = {
  sessionToken: string,
  email?: ?string,
  phoneCallingCode?: ?string,
  phoneNumber?: ?string,
}

type SendMfaCodeResponse = {
  success: boolean,
}

export const typeDefs: any = gql`
  input SendMfaCodeInput {
    sessionToken: String!
    email: String
    phoneCallingCode: String
    phoneNumber: String
  }

  type SendMfaCodeResponse {
    success: Boolean!
  }
`

export async function resolver(
  _: any,
  args: { input: SendMfaCodeInput },
  ctx: any,
): Promise<SendMfaCodeResponse> {
  const { sessionToken, email, phoneCallingCode, phoneNumber } = args.input
  const session = await unpackSessionToken(sessionToken, ctx)

  await sendCode({
    userId: session.userId,
    email,
    phoneCallingCode,
    phoneNumber,
  })

  return {
    success: true,
  }
}

export async function sendCode(method: {
  userId: string,
  email?: ?string,
  phoneCallingCode?: ?string,
  phoneNumber?: ?string,
}) {
  const { userId, email, phoneCallingCode, phoneNumber } = method

  if (email) {
    const code = await Security.genMfaCode({
      userId,
      email,
    })
    await Email.buildAndSend(
      new MfaCodeEmail(),
      [email],
      {},
      {
        code,
      },
    )
  } else if (phoneNumber) {
    if (!phoneCallingCode) {
      throw new Error(
        'phoneCallingCode must be passed together with phoneNumber.',
      )
    }

    const code = await Security.genMfaCode({
      userId,
      phoneCallingCode,
      phoneNumber,
    })
    await Twilio.sendSms(phoneNumber, `Phone Verification Code: ${code}`)
  }
}
