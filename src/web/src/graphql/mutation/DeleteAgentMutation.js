// @flow

import { gql } from '@apollo/client'
import apolloClient from '../../apolloClient.js'
import { showErrorModal } from '../../modals/ErrorModal.js'
import type { Agency } from '../../types/Agency.js'
import type { Viewer } from '../../types/Viewer.js'
import reportEvent from '../../utils/reportEvent.js'

type DeleteAgentInput = {
  sessionToken: string,
  agentId: number,
}

type DeleteAgentResponse = {
  success: boolean,
  agency: Agency,
  viewer: Viewer,
}

const DeleteAgentMutation: any = gql`
  mutation DeleteAgent($input: DeleteAgentInput!) {
    deleteAgent(input: $input) {
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

      # From GetAgencies, to update AgencyList:
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
  input: DeleteAgentInput,
): Promise<?DeleteAgentResponse> => {
  try {
    const res = await apolloClient.mutate({
      mutation: DeleteAgentMutation,
      variables: {
        input,
      },
    })

    if (res.data?.deleteAgent?.success) {
      reportEvent('DeleteAgentMutationSuccess', {})
    }

    return res.data.deleteAgent
  } catch (err) {
    console.error(err)
    showErrorModal(err.message)
  }
}
