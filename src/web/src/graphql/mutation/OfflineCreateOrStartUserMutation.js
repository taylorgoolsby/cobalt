// @flow

import { gql } from '@apollo/client'
import apolloClient from '../../apolloClient.js'
import { showErrorModal } from '../../modals/ErrorModal.js'

type OfflineCreateOrStartUserInput = {}

type OfflineCreateOrStartUserResponse = {
  success: boolean,
  passwordToken: string,
  userCreated: boolean,
}

const OfflineCreateOrStartUserMutation: any = gql`
  mutation OfflineCreateOrStartUser($input: OfflineCreateOrStartUserInput!) {
    offlineCreateOrStartUser(input: $input) {
      success
      passwordToken
      userCreated
    }
  }
`

export default async (
  input: OfflineCreateOrStartUserInput,
): Promise<?OfflineCreateOrStartUserResponse> => {
  try {
    const res = await apolloClient.mutate({
      mutation: OfflineCreateOrStartUserMutation,
      variables: {
        input,
      },
    })

    return res.data.offlineCreateOrStartUser
  } catch (err) {
    console.error(err)
    showErrorModal(err.message)
  }
}
