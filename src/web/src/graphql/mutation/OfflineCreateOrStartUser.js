// @flow

import { gql } from '@apollo/client'
import apolloClient from '../../apolloClient.js'
import { showErrorModal } from '../../modals/ErrorModal.js'

type OfflineCreateOrStartUserInput = {}

type OfflineCreateOrStartUserResponse = {
  success: boolean,
  passwordToken: string,
}

const OfflineCreateOrStartUser: any = gql`
  mutation OfflineCreateOrStartUser($input: OfflineCreateOrStartUserInput!) {
    offlineCreateOrStartUser(input: $input) {
      success
      passwordToken
    }
  }
`

export default async (
  input: OfflineCreateOrStartUserInput,
): Promise<?OfflineCreateOrStartUserResponse> => {
  try {
    const res = await apolloClient.mutate({
      mutation: OfflineCreateOrStartUser,
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
