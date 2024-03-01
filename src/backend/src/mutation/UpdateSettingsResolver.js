// @flow

import gql from 'graphql-tag'
import type { UserSQL } from '../schema/User/UserSchema.js'
import UserInterface from '../schema/User/UserInterface.js'
import { unpackMfaToken, unpackSessionToken } from '../utils/Token.js'
import nonMaybe from 'non-maybe'
import Phone from '../utils/Phone.js'
import Security from '../utils/Security.js'
import validator from 'validator'
import InferenceRest from '../rest/InferenceRest.js'
import createViewer from '../utils/createViewer.js'
import Config from 'common/src/Config.js'
import Email from '../rest/Email.js'

type UpdateSettingsInput = {
  sessionToken: string,
  username?: ?string,
  openAiKey?: ?string,
  useTrialKey?: ?boolean,
  email?: ?string,
  phoneCallingCode?: ?string,
  phoneNumber?: ?string,
  isMfaEnabled?: boolean,
  mfaToken?: ?string,
  password?: ?string,
  models?: ?string,
}

type UpdateSettingsResponse = {
  user: UserSQL,
  viewer: any,
}

export const typeDefs: any = gql`
  input UpdateSettingsInput {
    sessionToken: String!
    username: String
    openAiKey: String
    useTrialKey: Boolean
    email: String
    phoneCallingCode: String
    phoneNumber: String
    isMfaEnabled: Boolean
    mfaToken: String
    password: String
    models: String
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
      models,
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
    const session = await unpackSessionToken(sessionToken, ctx)

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

    if (!!models) {
      // Ensure models is parseable JSON array
      let parsedModels
      try {
        parsedModels = JSON.parse(models)
      } catch (err) {
        throw new Error('Models must be a valid JSON array')
      }
      if (!Array.isArray(parsedModels)) {
        throw new Error('Models must be a valid JSON array')
      }

      for (const m of parsedModels) {
        if (!(typeof m === 'object' && !Array.isArray(m))) {
          throw new Error('Each model must be a valid JSON object')
        }
        if (!m.title) {
          throw new Error('Each model must have a title')
        }
        if (!m.apiBase) {
          throw new Error('Each model must have an apiBase')
        }
        if (m.completionOptions) {
          if (
            !(
              typeof m.completionOptions === 'object' &&
              !Array.isArray(m.completionOptions)
            )
          ) {
            throw new Error('completionOptions must be a valid JSON object')
          }
          // Check that each field under completionOptions is a string or number:
          for (const [key, value] of Object.entries(m.completionOptions)) {
            if (!(typeof value === 'string' || typeof value === 'number')) {
              throw new Error(
                'Each field under completionOptions must be a string or number',
              )
            }
          }
        }
        // Ensure there are no two models with the same title:
        const titleCount = parsedModels.filter(
          (model) => model.title === m.title,
        ).length
        if (titleCount > 1) {
          throw new Error('Each model must have a unique title')
        }

        // Ensure each model's URL starts with http:// or https://
        if (!m.apiBase.match(/^https?:\/\//)) {
          throw new Error('API base must start with http:// or https://')
        }

        // Remove trailing slash if there is one:
        m.apiBase = m.apiBase.replace(/\/$/, '')

        // If the apiBase is the OpenAI API, ensure an apiKey is also defined:
        if (m.apiBase === 'https://api.openai.com') {
          if (!m.apiKey) {
            throw new Error('An apiKey must be defined for the OpenAI API')
          }

          // Also test if the key is good:
          try {
            await InferenceRest.getAvailableModels(m.apiKey)
          } catch (err) {
            throw new Error('The provided OpenAI API key is invalid')
          }
        }
      }

      await UserInterface.updateSettings(session.userId, {
        models: parsedModels,
      })
    }

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
