// @flow

import { gql } from '@apollo/client'
import apolloClient from '../../apolloClient.js'
import { showErrorModal } from '../../modals/ErrorModal.js'
import type { Agent } from '../../types/Agent.js'
import type { Agency } from '../../types/Agency.js'

type UpdateAgencyInput = {
  sessionToken: string,
  agencyId: number,
  // Passing in agents here will only update the agents' orderings.
  // This does not cause a new agency version to be created.
  agents?: Array<Agent>,
}

type UpdateAgencyResponse = {
  success: boolean,
  agency: Agency,
}

const UpdateAgencyMutation: any = gql`
  mutation UpdateAgency($input: UpdateAgencyInput!) {
    updateAgency(input: $input) {
      success
      agency {
        id
        agencyId
        versionId
        userId
        name
        description
        isPrivate
        isDeleted
        dateUpdated
        dateCreated

        agents {
          id
          agentId
          agencyId
          versionId
          name
          model
          orderIndex
          isDeleted
          dateUpdated
          dateCreated

          referenceId

          instructions {
            id
            instructionId
            agentId
            clause
            orderIndex
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
  input: UpdateAgencyInput,
): Promise<?UpdateAgencyResponse> => {
  try {
    const res = await apolloClient.mutate({
      mutation: UpdateAgencyMutation,
      variables: {
        input,
      },
    })

    return res.data.updateAgency
  } catch (err) {
    console.error(err)
    showErrorModal(err.message)
  }
}
