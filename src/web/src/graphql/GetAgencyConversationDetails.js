// @flow

import { gql } from '@apollo/client'

const GetAgencyConversationDetails: any = gql`
  query GetAgencyConversationDetails(
    $sessionToken: String
    $agencyId: Int
    $agencyConversationId: String
  ) {
    viewer(sessionToken: $sessionToken) {
      id
      agency(agencyId: $agencyId) {
        id

        agencyConversation(agencyConversationId: $agencyConversationId) {
          id

          agencyConversationId
          agencyId
          name
          isDeleted
          dateUpdated
          dateCreated

          managerConversation {
            id

            agentConversationId
            agencyConversationId
            agentId
            isDeleted
            dateUpdated
            dateCreated

            messages {
              id

              messageId
              agentId
              agentConversationId
              role
              linkedMessageId
              data {
                id
                internalInstruction
                userInstruction
                toApi
                fromApi
                completed
                toAgentId
                fromAgentId
                text
              }
              dateCreated
            }
          }

          agentConversations {
            id

            agentConversationId
            agencyConversationId
            agentId
            isDeleted
            dateUpdated
            dateCreated

            messages {
              id

              messageId
              agentId
              agentConversationId
              role
              linkedMessageId
              data {
                id
                internalInstruction
                userInstruction
                toApi
                fromApi
                completed
                toAgentId
                fromAgentId
                text
              }
              dateCreated
            }
          }
        }
      }
    }
  }
`

export default GetAgencyConversationDetails
