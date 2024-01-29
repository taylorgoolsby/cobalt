// @flow

import gql from 'graphql-tag'
import { createPasswordToken } from '../utils/Token.js'
import UserInterface from '../schema/User/UserInterface.js'
import Security from '../utils/Security.js'
import validator from 'validator'
import nonMaybe from 'non-maybe'
import { sendCode } from './SendMfaCodeResolver.js'

type VerifyPasswordInput = {
  email: string,
  password: string,
}

type VerifyPasswordResponse = {
  success: boolean,
  userId?: ?string,
  passwordToken?: string,
  isMfaNeeded?: boolean,
  mfaPhoneCallingCode?: ?string,
  mfaPhoneNumber?: ?string,
}

export const typeDefs: any = gql`
  input VerifyPasswordInput {
    email: String!
    password: String!
  }

  type VerifyPasswordResponse {
    success: Boolean!
    userId: String
    passwordToken: String
    isMfaNeeded: Boolean
    mfaPhoneCallingCode: String
    mfaPhoneNumber: String
  }
`

export async function resolver(
  _: any,
  args: { input: VerifyPasswordInput },
  ctx: any,
): Promise<VerifyPasswordResponse> {
  const { email, password } = args.input

  if (!validator.isEmail(email)) {
    throw new Error('This is not a valid email.')
  }

  const existingUser = await UserInterface.getByEmail(email)
  if (!existingUser) {
    return {
      success: false,
    }
  } else {
    const hashedPassword = existingUser.hashedPassword
    if (!hashedPassword) {
      // User does not have password setup. For example, sign up via OAuth.
      return {
        success: false,
      }
    }

    if (existingUser.isTemp) {
      // user has signed up using email and password but has not completed email verification.
      return {
        success: false,
      }
    }

    const start = Date.now()
    const passwordCorrect = await Security.checkPassword(
      password,
      hashedPassword,
    )
    if (passwordCorrect) {
      const passwordToken = await createPasswordToken(
        existingUser.userId,
        email,
      )

      const isMfaNeeded =
        existingUser.isMfaEnabled &&
        !!existingUser.phoneCallingCode &&
        !!existingUser.phoneNumber

      if (isMfaNeeded) {
        await sendCode({
          userId: existingUser.userId,
          // email,
          phoneCallingCode: existingUser.phoneCallingCode,
          phoneNumber: existingUser.phoneNumber,
        })
      }

      return {
        success: true,
        userId: existingUser.userId,
        passwordToken,
        isMfaNeeded,
        mfaPhoneCallingCode: isMfaNeeded
          ? nonMaybe(existingUser.phoneCallingCode)
          : null,
        mfaPhoneNumber: isMfaNeeded
          ? nonMaybe(existingUser.phoneNumber).replace(
              /^(1)(\d+)(\d\d\d\d)$/g,
              (match, p1, p2, p3) => {
                return `${p1}${''.padStart(p2.length, '•')}${p3}`
              },
            )
          : null,
      }
    } else {
      throw new Error('The combination of email and password was wrong.')
    }
  }
}
