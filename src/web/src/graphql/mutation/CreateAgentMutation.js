// @flow

import type { Instruction } from '../../types/Instruction.js'
import { gql } from '@apollo/client'
import apolloClient from '../../apolloClient.js'
import { showErrorModal } from '../../modals/ErrorModal.js'
import type { Agency } from '../../types/Agency.js'
import type { Viewer } from '../../types/Viewer.js'
import reportEvent from '../../utils/reportEvent.js'

type CreateAgentInput = {
  sessionToken: string,
  agencyId: number,
  model: string,
  name: string,
  // Agents are ordered DESC so that new agents can be added to the top
  // without the need to update all the other agents' orderIndex.
  orderIndex: number,
  instructions: Array<Instruction>,
}

type CreateAgentResponse = {
  success: boolean,
  agency: Agency,
  agentId: number,
  viewer: Viewer,
}

const CreateAgentMutation: any = gql`
  mutation CreateAgent($input: CreateAgentInput!) {
    createAgent(input: $input) {
      success
      agentId
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
  input: CreateAgentInput,
): Promise<?CreateAgentResponse> => {
  try {
    const res = await apolloClient.mutate({
      mutation: CreateAgentMutation,
      variables: {
        input,
      },
    })

    if (res.data?.createAgent?.success) {
      const event: any = input
      delete event['sessionToken']
      reportEvent('CreateAgentMutationSuccess', {})
    }

    return res.data.createAgent
  } catch (err) {
    console.error(err)
    showErrorModal(err.message)
  }
}
