// @flow

import { gql } from '@apollo/client'

const GetAgencies: any = gql`
  query GetAgencies($sessionToken: String!) {
    viewer(sessionToken: $sessionToken) {
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
`

export default GetAgencies
