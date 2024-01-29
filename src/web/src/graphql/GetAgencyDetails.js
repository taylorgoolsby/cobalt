// @flow

import { gql } from '@apollo/client'

const GetAgencyDetails: any = gql`
  query GetAgencyDetails(
    $sessionToken: String
    $lookupId: String
    $agencyId: Int
  ) {
    viewer(sessionToken: $sessionToken) {
      id
      agency(lookupId: $lookupId, agencyId: $agencyId) {
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
    }
  }
`

export default GetAgencyDetails
