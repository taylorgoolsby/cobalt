// @flow

import { gql } from '@apollo/client'

const GetPublicUser: any = gql`
  query GetPublicUser($username: String!) {
    viewer {
      id
      user(username: $username) {
        id
      }
    }
  }
`

export default GetPublicUser
