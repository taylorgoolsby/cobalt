// @flow

import { gql } from '@apollo/client'

const GetAgencyVersions: any = gql`
  query GetAgencyVersions($sessionToken: String, $lookupId: String) {
    viewer(sessionToken: $sessionToken) {
      id
      agency(lookupId: $lookupId) {
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

        versions {
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
`

export default GetAgencyVersions
