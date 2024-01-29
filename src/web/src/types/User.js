// @flow

import type { Agency } from './Agency.js'
import type { AuthToken } from './AuthToken.js'

export type User = {
  userId?: string,
  username?: string,
  email?: string,
  isEmailVerified?: boolean,
  phoneCallingCode?: ?string,
  phoneNumber?: ?string,
  isPhoneVerified?: boolean,
  isMfaEnabled?: boolean,
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
