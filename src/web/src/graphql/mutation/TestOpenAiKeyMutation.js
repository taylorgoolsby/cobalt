// @flow

import { gql } from '@apollo/client'
import apolloClient from '../../apolloClient.js'
import { showErrorModal } from '../../modals/ErrorModal.js'

type TestOpenAiKeyInput = {
  sessionToken: string,
  openAiKey: string,
}

type TestOpenAiKeyResponse = {
  success: boolean,
}

const TestOpenAiKeyMutation: any = gql`
  mutation TestOpenAiKey($input: TestOpenAiKeyInput!) {
    testOpenAiKey(input: $input) {
      success
    }
  }
`

export default async (
  input: TestOpenAiKeyInput,
): Promise<?TestOpenAiKeyResponse> => {
  try {
    const res = await apolloClient.mutate({
      mutation: TestOpenAiKeyMutation,
      variables: {
        input,
      },
    })

    return res.data.testOpenAiKey
  } catch (err) {
    console.error(err)
    // Don't want errors to go to modal because this function is meant to be used with input validation check mark.
    // showErrorModal(err.message)
  }
}
