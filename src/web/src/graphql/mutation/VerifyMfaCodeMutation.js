// @flow

import { gql } from '@apollo/client'
import apolloClient from '../../apolloClient.js'
import { showErrorModal } from '../../modals/ErrorModal.js'

type VerifyMfaCodeInput = {
  userId: string,
  code: string,
}

type VerifyMfaCodeResponse = {
  success: boolean,
  mfaToken: string,
}

const VerifyMfaCodeMutation: any = gql`
  mutation VerifyMfaCode($input: VerifyMfaCodeInput!) {
    verifyMfaCode(input: $input) {
      success
      mfaToken
    }
  }
`

export default async (
  input: VerifyMfaCodeInput,
): Promise<?VerifyMfaCodeResponse> => {
  try {
    const res = await apolloClient.mutate({
      mutation: VerifyMfaCodeMutation,
      variables: {
        input,
      },
    })

    return res.data.verifyMfaCode
  } catch (err) {
    console.error(err)
    showErrorModal(err.message)
  }
}
