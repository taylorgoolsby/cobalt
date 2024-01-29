// @flow

import { gql } from '@apollo/client'
import apolloClient from '../../apolloClient.js'
import { showErrorModal } from '../../modals/ErrorModal.js'

type MergeAccountsInput = {
  currentSessionToken: string,
  previousSessionToken: string,
}

type MergeAccountsResponse = {
  success: boolean,
  finalSessionToken?: string,
  errorAlreadyMerged?: boolean,
}

const MergeAccountsMutation: any = gql`
  mutation MergeAccounts($input: MergeAccountsInput!) {
    mergeAccounts(input: $input) {
      success
      finalSessionToken
      errorAlreadyMerged
    }
  }
`

export default async (
  input: MergeAccountsInput,
): Promise<?MergeAccountsResponse> => {
  try {
    const res = await apolloClient.mutate({
      mutation: MergeAccountsMutation,
      variables: {
        input,
      },
    })

    return res.data.mergeAccounts
  } catch (err) {
    console.error(err)
    showErrorModal(err.message)
  }
}
