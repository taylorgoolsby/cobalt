// @flow

import { print } from 'graphql'
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  from,
} from '@apollo/client'
import Config from './Config.js'

export const apolloCache: any = new InMemoryCache({
  dataIdFromObject(res) {
    // console.log('res', res)
    return res.id
  },
  typePolicies: {
    User: {
      fields: {
        agencies: {
          merge(existing, incoming) {
            return incoming
          },
        },
      },
    },
    Agency: {
      fields: {
        agents: {
          merge(existing, incoming) {
            return incoming
          },
        },
      },
    },
    Agent: {
      fields: {
        instructions: {
          merge(existing, incoming) {
            return incoming
          },
        },
      },
    },
    AgentConversation: {
      fields: {
        messages: {
          merge(existing, incoming) {
            return incoming
          },
        },
      },
    },
  },
})

const httpLink = new HttpLink({ uri: `${Config.backendHost}/graphql` })

const logger = new ApolloLink((operation, forward) => {
  const startTime = Date.now()

  return forward(operation).map((response) => {
    const query = print(operation.query)
    const isMutation = query.trimStart().startsWith('mutation')

    if (response.data && !response.errors) {
      console.groupCollapsed(
        `%c${isMutation ? 'Mutation' : 'Query'}`,
        `color: #489bfd; font-weight: bold;`,
        operation.operationName,
      )
    } else if (response.data && response.errors) {
      console.group(
        `%c${isMutation ? 'Mutation' : 'Query'}`,
        `color: #f9e124; font-weight: bold;`,
        operation.operationName,
      )
    } else if (!response.data && response.errors) {
      console.group(
        `%c${isMutation ? 'Mutation' : 'Query'}`,
        `color: #ea2929; font-weight: bold;`,
        operation.operationName,
      )
    }

    console[response.errors ? 'group' : 'groupCollapsed']('Selection')
    console.log(query)
    console.groupEnd()

    console.log('Variables', operation.variables)

    if (response.data) {
      console.log('Data', response.data)
    }
    if (response.errors) {
      console.group('Errors')
      for (const error of response.errors) {
        console.log(error)
      }
      console.groupEnd()
    }

    console.log('Sent', new Date(startTime).toISOString())
    console.log('Elapsed', Date.now() - startTime)

    console.groupEnd()

    return response
  })
})

const apolloClient: any = new ApolloClient({
  cache: apolloCache,
  link: from([logger, httpLink]),
})

export default apolloClient
