// @flow

import type { User } from '../../types/User.js'
import { gql } from '@apollo/client'
import apolloClient from '../../apolloClient.js'
import { showErrorModal } from '../../modals/ErrorModal.js'
import reportEvent from '../../utils/reportEvent.js'

export type UpdateSettingsInput = {
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
  user: User,
}

const UpdateSettingsMutation: any = gql`
  mutation UpdateSettings($input: UpdateSettingsInput!) {
    updateSettings(input: $input) {
      viewer {
        id
        currentUser {
          id
          userId
          username
          email
          isEmailVerified
          phoneCallingCode
          phoneNumber
          isPhoneVerified
          isMfaEnabled
          gptModels
          dateUpdated
          dateCreated

          maskedOpenAiKey
          hasPassword
          hasOpenAiKey
          hasGithubOAuth
          hasGoogleOAuth
          isOnboarded
        }
      }
      user {
        id
        userId
        username
        email
        isEmailVerified
        phoneCallingCode
        phoneNumber
        isPhoneVerified
        isMfaEnabled
        dateUpdated
        dateCreated

        maskedOpenAiKey
        isOnboarded
        hasPassword
        hasGithubOAuth
        hasGoogleOAuth
      }
    }
  }
`

export default async (
  input: UpdateSettingsInput,
): Promise<?UpdateSettingsResponse> => {
  try {
    const res = await apolloClient.mutate({
      mutation: UpdateSettingsMutation,
      variables: {
        input,
      },
    })

    if (res.data?.updateSettings?.success) {
      reportEvent('UpdateSettingsMutationSuccess', {})
    }

    return res.data.updateSettings
  } catch (err) {
    console.error(err)
    showErrorModal(err.message)
  }
}
