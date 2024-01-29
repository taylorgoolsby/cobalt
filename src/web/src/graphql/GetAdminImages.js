// @flow

import { gql } from '@apollo/client'

const GetAdminImages: any = gql`
  query GetAdminImages($sessionToken: String!) {
    viewer(sessionToken: $sessionToken) {
      id
      currentUser {
        id
        adminImages
      }
    }
  }
`

export default GetAdminImages
