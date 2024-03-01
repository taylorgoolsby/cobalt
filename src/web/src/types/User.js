// @flow

import type { Agency } from './Agency.js'
import type { AuthToken } from './AuthToken.js'

export type Model = {
  // This tries to conform to the naming scheme used by continue.dev config: https://continue.dev/docs/reference/Model%20Providers/openai
  title: string,
  apiBase: string,
  apiKey?: ?string,
  completionOptions?: ?{ ... },
}

export type User = {
  userId?: string,
  username?: string,
  email?: string,
  isEmailVerified?: boolean,
  phoneCallingCode?: ?string,
  phoneNumber?: ?string,
  isPhoneVerified?: boolean,
  isMfaEnabled?: boolean,
  models?: Array<Model>,
  gptModels?: Array<string>,
  dateUpdated?: number,
  dateCreated?: number,

  id?: string,
  profilePictureUrl?: ?string,
  maskedOpenAiKey?: ?string,
  isOnboarded?: boolean,
  hasPassword?: boolean,
  hasOpenAiKey?: boolean,
  hasGithubOAuth?: boolean,
  hasGoogleOAuth?: boolean,
  authTokens?: Array<AuthToken>,
  agencies?: Array<Agency>,
}
