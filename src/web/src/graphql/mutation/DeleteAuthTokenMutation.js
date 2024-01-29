// @flow

import { gql } from '@apollo/client'
import apolloClient from '../../apolloClient.js'
import { showErrorModal } from '../../modals/ErrorModal.js'

type DeleteAuthTokenInput = {
  sessionToken: string,
}

type DeleteAuthTokenResponse = {
  success: boolean,
}

const DeleteAuthTokenMutation: any = gql`
  mutation DeleteAuthToken($input: DeleteAuthTokenInput!, $agencyId: Int!) {
    deleteAuthToken(input: $input) {
      success
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
  input: DeleteAuthTokenInput,
  agencyId: number,
): Promise<?DeleteAuthTokenResponse> => {
  try {
    const res = await apolloClient.mutate({
      mutation: DeleteAuthTokenMutation,
      variables: {
        input,
        agencyId,
      },
    })

    return res.data.deleteAuthToken
  } catch (err) {
    console.error(err)
    showErrorModal(err.message)
  }
}
