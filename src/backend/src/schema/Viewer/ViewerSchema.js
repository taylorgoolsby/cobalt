// @flow

import type { ResolverDefs } from '../../utils/resolver.js'
import type { SessionToken } from '../../utils/Token.js'
import gql from 'graphql-tag'
import User from '../User/UserInterface.js'
import resolver from '../../utils/resolver.js'
import type { AgencySQL } from '../Agency/AgencySchema.js'
import AgencyInterface from '../Agency/AgencyInterface.js'

export const typeDefs: any = gql`
  type Viewer {
    id: String
    currentUser: User
    agency(agencyId: Int, lookupId: String): Agency
  }
`

export const resolvers: ResolverDefs = {
  Viewer: {
    id: resolver(async (obj: SessionToken, args, ctx) => {
      if (ctx.isAuthenticated) {
        return `Session:${obj.userId}`
      } else {
        return `Session:anonymous`
      }
    }), // obj comes from Session.createSession
    currentUser: resolver(async (obj, args, ctx) => {
      if (!ctx.isAuthenticated) {
        return null
      }

      const user = await User.getUser(obj.userId)
      return user
    }),
    agency: resolver(
      async (
        obj: SessionToken,
        args: { agencyId?: ?number, lookupId?: ?string },
      ): Promise<?AgencySQL> => {
        if (!args.agencyId && !args.lookupId) {
          return null
        }

        if (args.agencyId) {
          const agency = await AgencyInterface.getOwned(
            args.agencyId,
            obj.userId,
          )
          return agency
        } else if (args.lookupId) {
          const agency = await AgencyInterface.getOwnedByLookupId(
            args.lookupId,
            obj.userId,
          )
          return agency
        }
      },
    ),
  },
}
