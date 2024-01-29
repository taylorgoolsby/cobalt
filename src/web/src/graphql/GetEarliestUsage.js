// @flow

import { gql } from '@apollo/client'

const GetEarliestUsage: any = gql`
  query GetEarliestUsage($sessionToken: String!) {
    viewer(sessionToken: $sessionToken) {
      id
      currentUser {
        id
        earliestUsageISO
      }
    }
  }
`

export default GetEarliestUsage
