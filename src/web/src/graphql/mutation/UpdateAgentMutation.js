// @flow

import type { Instruction } from '../../types/Instruction.js'
import { gql } from '@apollo/client'
import apolloClient from '../../apolloClient.js'
import { showErrorModal } from '../../modals/ErrorModal.js'
import type { Agency } from '../../types/Agency.js'
import type { Viewer } from '../../types/Viewer.js'
import reportEvent from '../../utils/reportEvent.js'

// Calling this mutation will create a new agency version.
type UpdateAgentInput = {
  sessionToken: string,
  agentId: number,
  agencyId: number,
  name: string,
  model: string,
  orderIndex: number,
  instructions: Array<Instruction>,
}

type UpdateAgentResponse = {
  success: boolean,
  agency: Agency,
  viewer: Viewer,
}

const UpdateAgentMutation: any = gql`
  mutation UpdateAgent($input: UpdateAgentInput!) {
    updateAgent(input: $input) {
      success
      agency {
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

        agents {
          id
          agentId
          versionId
          agencyId
          name
          model
          orderIndex
          isManager
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
            canEdit
            isDeleted
            dateUpdated
            dateCreated
          }
        }
      }
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
  input: UpdateAgentInput,
): Promise<?UpdateAgentResponse> => {
  try {
    const res = await apolloClient.mutate({
      mutation: UpdateAgentMutation,
      variables: {
        input,
      },
    })

    if (res.data?.updateAgent?.success) {
      const event: any = input
      delete event['sessionToken']
      reportEvent('UpdateAgentMutationSuccess', event)
    }

    return res.data.updateAgent
  } catch (err) {
    console.error(err)
    showErrorModal(err.message)
  }
}
