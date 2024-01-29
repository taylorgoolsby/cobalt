// @flow

import { gql } from '@apollo/client'
import apolloClient from '../../apolloClient.js'
import { showErrorModal } from '../../modals/ErrorModal.js'

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

const VerifyPasswordMutation: any = gql`
  mutation VerifyPasswordMutation($input: VerifyPasswordInput!) {
    verifyPassword(input: $input) {
      success
      userId
      passwordToken
      isMfaNeeded
      mfaPhoneCallingCode
      mfaPhoneNumber
    }
  }
`

export default async (
  input: VerifyPasswordInput,
): Promise<?VerifyPasswordResponse> => {
  try {
    const res = await apolloClient.mutate({
      mutation: VerifyPasswordMutation,
      variables: {
        input,
      },
    })

    return res.data.verifyPassword
  } catch (err) {
    console.error(err.message)
    showErrorModal(err.message)
  }
}
