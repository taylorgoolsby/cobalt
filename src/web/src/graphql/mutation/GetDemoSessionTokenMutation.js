// @flow

import { gql } from '@apollo/client'
import apolloClient from '../../apolloClient.js'
import { showErrorModal } from '../../modals/ErrorModal.js'

type GetDemoSessionTokenInput = {
  sessionToken: string,
  agencyId: number,
}

type GetDemoSessionTokenResponse = {
  success: boolean,
  demoSessionToken: string,
}

const GetDemoSessionTokenMutation: any = gql`
  mutation GetDemoSessionToken($input: GetDemoSessionTokenInput!) {
    getDemoSessionToken(input: $input) {
      success
      demoSessionToken
    }
  }
`

export default async (
  input: GetDemoSessionTokenInput,
): Promise<?GetDemoSessionTokenResponse> => {
  try {
    const res = await apolloClient.mutate({
      mutation: GetDemoSessionTokenMutation,
      variables: {
        input,
      },
    })

    return res.data.getDemoSessionToken
  } catch (err) {
    console.error(err)
    showErrorModal(err.message)
  }
}
