// @flow

import { gql } from '@apollo/client'

const GetCurrentUser: any = gql`
  query GetCurrentUser($sessionToken: String) {
    viewer(sessionToken: $sessionToken) {
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
        models
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
  }
`

export default GetCurrentUser
