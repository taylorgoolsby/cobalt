// @flow

import { gql } from '@apollo/client'

const GetProjects: any = gql`
  query GetProjects(
    $sessionToken: String!
    $offset: Int!
    $limit: Int!
    $countNewLimit: Int!
    $orderings: [PaginationOrdering!]!
    $countLoaded: Int!
    $offsetRelativeTo: String
  ) {
    viewer(sessionToken: $sessionToken) {
      id
      currentUser {
        id
        projects(
          offset: $offset
          limit: $limit
          orderings: $orderings
          offsetRelativeTo: $offsetRelativeTo
          countLoaded: $countLoaded
          countNewLimit: $countNewLimit
        ) {
          nodes {
            id
            projectId
            title
            description
            assets {
              id
              url
              type
              dateCreated
            }
            dateCreated
          }
          info {
            hasMore
            hasNew
            countNew
            moreOffset
            nextOffsetRelativeTo
          }
        }
      }
    }
  }
`

export default GetProjects
