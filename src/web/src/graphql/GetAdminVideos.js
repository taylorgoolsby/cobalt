// @flow

import { gql } from '@apollo/client'

const GetAdminVideos: any = gql`
  query GetAdminVideos($sessionToken: String!) {
    viewer(sessionToken: $sessionToken) {
      id
      currentUser {
        id
        adminVideos
      }
    }
  }
`

export default GetAdminVideos
