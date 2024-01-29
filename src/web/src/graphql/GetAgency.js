// @flow

import { gql } from '@apollo/client'

const GetAgency: any = gql`
  query GetAgency($sessionToken: String, $lookupId: String) {
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
      }
    }
  }
`

export default GetAgency
