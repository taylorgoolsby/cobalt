// @flow

import { gql } from '@apollo/client'

const GetAgencyConversations: any = gql`
  query GetAgencyConversations($sessionToken: String, $agencyId: Int) {
    viewer(sessionToken: $sessionToken) {
      id
      agency(agencyId: $agencyId) {
        id

        debuggingConversations {
          id

          agencyConversationId
          agencyId
          name
          isDeleted
          dateUpdated
          dateCreated
        }
      }
    }
  }
`

export default GetAgencyConversations
