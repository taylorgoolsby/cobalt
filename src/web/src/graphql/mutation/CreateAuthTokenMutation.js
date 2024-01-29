// @flow

import { gql } from '@apollo/client'
import apolloClient from '../../apolloClient.js'
import { showErrorModal } from '../../modals/ErrorModal.js'

type CreateAuthTokenInput = {
  sessionToken: string,
  agencyId: number,
  name: string,
}

type CreateAuthTokenResponse = {
  success: boolean,
  unmaskedToken: string,
}

const CreateAuthTokenMutation: any = gql`
  mutation CreateAuthToken($input: CreateAuthTokenInput!, $agencyId: Int!) {
    createAuthToken(input: $input) {
      success
      unmaskedToken
      user {
        id
        authTokens(agencyId: $agencyId) {
          id
          authTokenId
          agencyVersionId
          name
          token
          dateDeleted
          dateUpdated
          dateCreated
        }
      }
    }
  }
`

export default async (
  input: CreateAuthTokenInput,
): Promise<?CreateAuthTokenResponse> => {
  try {
    const res = await apolloClient.mutate({
      mutation: CreateAuthTokenMutation,
      variables: {
        input,
        agencyId: input.agencyId,
      },
    })

    return res.data.createAuthToken
  } catch (err) {
    console.error(err)
    showErrorModal(err.message)
  }
}
