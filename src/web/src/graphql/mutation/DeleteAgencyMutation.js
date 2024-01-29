// @flow

import { gql } from '@apollo/client'
import apolloClient from '../../apolloClient.js'
import { showErrorModal } from '../../modals/ErrorModal.js'

type DeleteAgencyInput = {
  sessionToken: string,
  agencyId: number,
}

type DeleteAgencyResponse = {
  success: boolean,
}

const DeleteAgencyMutation: any = gql`
  mutation DeleteAgency($input: DeleteAgencyInput!) {
    deleteAgency(input: $input) {
      success
      # From GetAgencies
      viewer {
        id
        currentUser {
          id

          agencies {
            id
            agencyId
            versionId
            lookupId
            userId
            name
            description
            isPrivate
            isDeleted
            dateUpdated
            dateCreated
          }
        }
      }
    }
  }
`

export default async (
  input: DeleteAgencyInput,
): Promise<?DeleteAgencyResponse> => {
  try {
    const res = await apolloClient.mutate({
      mutation: DeleteAgencyMutation,
      variables: {
        input,
      },
    })

    return res.data.deleteAgency
  } catch (err) {
    console.error(err)
    showErrorModal(err.message)
  }
}
