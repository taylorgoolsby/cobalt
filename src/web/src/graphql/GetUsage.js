// @flow

import { gql } from '@apollo/client'

const GetUsage: any = gql`
  query GetUsage($sessionToken: String!, $monthISO: String!) {
    viewer(sessionToken: $sessionToken) {
      id
      currentUser {
        id
        usageCounts(monthISO: $monthISO)
      }
    }
  }
`

export default GetUsage
