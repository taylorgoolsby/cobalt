// @flow

import { gql } from '@apollo/client'
import apolloClient from '../../apolloClient.js'
import { showErrorModal } from '../../modals/ErrorModal.js'

type GetDemoExampleInput = {
  sessionToken: string,
  agencyId: number,
}

type GetDemoExampleResponse = {
  success: boolean,
  exampleHtml: string,
}

const GetDemoExampleMutation: any = gql`
  mutation GetDemoExample($input: GetDemoExampleInput!) {
    getDemoExample(input: $input) {
      success
      exampleHtml
    }
  }
`

export default async (
  input: GetDemoExampleInput,
): Promise<?GetDemoExampleResponse> => {
  try {
    const res = await apolloClient.mutate({
      mutation: GetDemoExampleMutation,
      variables: {
        input,
      },
    })

    return res.data.getDemoExample
  } catch (err) {
    console.error(err)
    showErrorModal(err.message)
  }
}
