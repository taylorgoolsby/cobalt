// @flow

import gql from 'graphql-tag'
import type { UserSQL } from '../schema/User/UserSchema.js'
import UserInterface from '../schema/User/UserInterface.js'
import { unpackMfaToken, unpackSession } from '../utils/Token.js'
import nonMaybe from 'non-maybe'
import Phone from '../utils/Phone.js'
import Security from '../utils/Security.js'
import validator from 'validator'
import ChatGPTRest from '../rest/ChatGPTRest.js'
import createViewer from '../utils/createViewer.js'
import Config from 'common/src/Config.js'
import Email from '../rest/Email.js'

type UpdateSettingsInput = {
  sessionToken: string,
  apiBase?: ?string,
  apiKey?: ?string,
  username?: ?string,
  openAiKey?: ?string,
  useTrialKey?: ?boolean,
  email?: ?string,
  phoneCallingCode?: ?string,
  phoneNumber?: ?string,
  isMfaEnabled?: boolean,
  mfaToken?: ?string,
  password?: ?string,
}

type UpdateSettingsResponse = {
  user: UserSQL,
  viewer: any,
}

export const typeDefs: any = gql`
  input UpdateSettingsInput {
    sessionToken: String!
    apiBase: String
    apiKey: String
    username: String
    openAiKey: String
    useTrialKey: Boolean
    email: String
    phoneCallingCode: String
    phoneNumber: String
    isMfaEnabled: Boolean
    mfaToken: String
    password: String
  }

  type UpdateSettingsResponse {
    user: User
    viewer: Viewer
  }
`

export async function resolver(
  _: any,
  args: { input: UpdateSettingsInput },
  ctx: any,
): Promise<UpdateSettingsResponse> {
  try {
    const {
      sessionToken,
      apiKey,
      // username,
      // openAiKey,
      // useTrialKey,
      // email,
      // phoneCallingCode,
      // phoneNumber,
      // isMfaEnabled,
      // mfaToken,
      // password,
    } = args.input
    let apiBase = args.input.apiBase
    const session = await unpackSession(sessionToken, ctx)

    const existingUser = await UserInterface.getUser(session.userId)
    if (!existingUser) {
      throw new Error('User does not exist.')
    }

    // let hashedPassword: ?string = password === null ? null : undefined
    // if (password) {
    //   hashedPassword = await Security.hashPassword(password)
    // }
    //
    // if (phoneCallingCode || phoneNumber) {
    //   const phoneChanged =
    //     existingUser.phoneCallingCode !== phoneCallingCode ||
    //     existingUser.phoneNumber !== phoneNumber
    //   if (phoneChanged) {
    //     if (!isMfaEnabled) {
    //       throw new Error(
    //         'If phone number is provided, then mfa should be enabled.',
    //       )
    //     }
    //     if (!Phone.isValid(phoneCallingCode, phoneNumber)) {
    //       throw new Error('The provided phone number is invalid.')
    //     }
    //     if (!mfaToken) {
    //       throw new Error(
    //         'An mfaToken must be provided to verify phone number.',
    //       )
    //     }
    //     const unpackedToken = await unpackMfaToken(mfaToken)
    //     if (
    //       !(
    //         unpackedToken.userId === session.userId &&
    //         unpackedToken.phoneCallingCode === phoneCallingCode &&
    //         unpackedToken.phoneNumber === phoneNumber
    //       )
    //     ) {
    //       throw new Error('The phone number has not been verified.')
    //     }
    //   }
    // }
    //
    // if (email === null) {
    //   throw new Error('Email cannot be deleted.')
    // }
    // if (email) {
    //   const emailChanged = existingUser.email !== email
    //   if (emailChanged) {
    //     const isEmailValid = validator.isEmail(email)
    //     if (!isEmailValid) {
    //       throw new Error('Email is not valid.')
    //     }
    //     if (!mfaToken) {
    //       throw new Error('An mfaToken must be provided to verify email.')
    //     }
    //     const unpackedToken = await unpackMfaToken(mfaToken)
    //     if (
    //       !(
    //         unpackedToken.userId === session.userId &&
    //         unpackedToken.email === email
    //       )
    //     ) {
    //       throw new Error('The email has not been verified.')
    //     }
    //   }
    // }

    // if (openAiKey) {
    //   // If this call does not error out, then the key is good.
    //   const models = await ChatGPTRest.getAvailableModels(openAiKey)
    //   await UserInterface.updateGptModels(session.userId, models)
    // } else if (useTrialKey) {
    //   if (openAiKey !== null && openAiKey !== undefined) {
    //     throw new Error('openAiKey should be null when useTrialKey is true.')
    //   }
    //   const models = await ChatGPTRest.getAvailableModels(
    //     Config.openAiPublicTrialKey,
    //   )
    //   await UserInterface.updateGptModels(session.userId, models)
    // }

    // await UserInterface.updateSettings(session.userId, {
    //   username,
    //   openAiKey:
    //     useTrialKey || openAiKey
    //       ? useTrialKey
    //         ? Config.openAiPublicTrialKey
    //         : openAiKey
    //       : undefined,
    //   email,
    //   phoneCallingCode,
    //   phoneNumber,
    //   isMfaEnabled,
    //   hashedPassword,
    // })

    if (!!apiBase) {
      // Ensure URL starts with http:// or https://
      if (!apiBase.match(/^https?:\/\//)) {
        throw new Error('API base must start with http:// or https://')
      }

      // Remove trailing slash if there is one:
      apiBase = apiBase.replace(/\/$/, '')
    }

    await UserInterface.updateSettings(session.userId, {
      inferenceServerConfig: {
        apiBase,
        apiKey,
      },
    })

    const updatedUser = await UserInterface.getUser(session.userId)

    if (!existingUser.username && !!updatedUser?.username) {
      await Email.sendAdminNotification(
        `A new user has completed onboarding: ${updatedUser.username}`,
      )
    }

    return {
      user: nonMaybe(updatedUser),
      viewer: await createViewer(sessionToken, ctx),
    }
  } catch (err) {
    console.error(err)
    throw err
  }
}
