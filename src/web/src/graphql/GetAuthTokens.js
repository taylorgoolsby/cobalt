// @flow

import { gql } from '@apollo/client'

const GetAuthTokens: any = gql`
  query GetAuthTokens($sessionToken: String!, $agencyId: Int!) {
    viewer(sessionToken: $sessionToken) {
      id
      currentUser {
        id
        authTokens(agencyId: $agencyId) {
          id
          authTokenId
          agencyVersionId
          name
          token
          dateDeleted
          dateUpdated
          dateCreated
        }
      }
    }
  }
`

export default GetAuthTokens
