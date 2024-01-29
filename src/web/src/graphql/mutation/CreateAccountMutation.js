// @flow

import { gql } from '@apollo/client'
import apolloClient from '../../apolloClient.js'
import { showErrorModal } from '../../modals/ErrorModal.js'

type CreateAccountInput = {
  email: string,
  password: string,
}

export type CreateAccountResponse = {
  done: boolean,
}

const CreateAccountMutation: any = gql`
  mutation CreateAccount($input: CreateAccountInput!) {
    createAccount(input: $input) {
      done
    }
  }
`

export default async (
  input: CreateAccountInput,
): Promise<?CreateAccountResponse> => {
  try {
    const res = await apolloClient.mutate({
      mutation: CreateAccountMutation,
      variables: {
        input,
      },
    })

    return res.data.createAccount
  } catch (err) {
    console.error(err)
    showErrorModal(err.message)
  }
}
