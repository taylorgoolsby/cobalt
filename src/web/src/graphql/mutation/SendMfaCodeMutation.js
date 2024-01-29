// @flow

import { gql } from '@apollo/client'
import apolloClient from '../../apolloClient.js'
import { showErrorModal } from '../../modals/ErrorModal.js'

type SendMfaCodeInput = {
  sessionToken: string,
  email?: ?string,
  phoneCallingCode?: ?string,
  phoneNumber?: ?string,
}

type SendMfaCodeResponse = {
  success: boolean,
}

const SendMfaCodeMutation: any = gql`
  mutation SendMfaCode($input: SendMfaCodeInput!) {
    sendMfaCode(input: $input) {
      success
    }
  }
`

export default async (
  input: SendMfaCodeInput,
): Promise<?SendMfaCodeResponse> => {
  try {
    const res = await apolloClient.mutate({
      mutation: SendMfaCodeMutation,
      variables: {
        input,
      },
    })

    return res.data.sendMfaCode
  } catch (err) {
    console.error(err)
    showErrorModal(err.message)
  }
}
