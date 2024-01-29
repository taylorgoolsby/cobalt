// @flow

import { gql } from '@apollo/client'

const GetPublicProjects: any = gql`
  query GetPublicProjects(
    $username: String!
    $offset: Int!
    $limit: Int!
    $countNewLimit: Int!
    $orderings: [PaginationOrdering!]!
    $countLoaded: Int!
    $offsetRelativeTo: String
  ) {
    viewer {
      id
      user(username: $username) {
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

export default GetPublicProjects
