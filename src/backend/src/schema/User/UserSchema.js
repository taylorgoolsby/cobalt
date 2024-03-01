// @flow

import type { ResolverDefs } from '../../utils/resolver.js'
import type { TokenResGithub } from '../../rest/GithubRest.js'
import type { AgencySQL } from '../Agency/AgencySchema.js'
import type { TokenResGoogle } from '../../rest/GoogleRest.js'
import gql from 'graphql-tag'
import resolver from '../../utils/resolver.js'
import AgencyInterface from '../Agency/AgencyInterface.js'
import AuthTokenInterface from '../AuthToken/AuthTokenInterface.js'
import type { AuthTokenSQL } from '../AuthToken/AuthTokenSchema.js'

export type ModelConfig = {
  // This tries to conform to the naming scheme used by continue.dev config: https://continue.dev/docs/reference/Model%20Providers/openai
  title: string,
  apiBase: string,
  apiKey?: ?string,
  completionOptions?: ?{ ... },
}

export type UserSQL = {|
  userId: string,
  combinedUserId: string,
  username: ?string,
  email: ?string,
  isEmailVerified: boolean,
  phoneCallingCode: ?string,
  phoneNumber: ?string,
  isPhoneVerified: boolean,
  isMfaEnabled: boolean,
  hashedPassword: ?string,
  isTemp: boolean,
  oauth: ?{
    github?: {
      token: TokenResGithub,
      id: string,
      email: string,
    },
    google?: {
      token: TokenResGoogle,
      id: string,
      email: string,
    },
  },
  oauthIdGithub: ?string,
  oauthIdGoogle: ?string,
  openAiKey: ?string,
  models: Array<ModelConfig>,
  gptModels: Array<string>,
  dateUpdated: string,
  dateCreated: string,
|}

export const typeDefs: any = gql`
  type User {
    userId: String @sql(type: "BINARY(16)", primary: true)
    combinedUserId: String @sql(type: "BINARY(16)", index: true)
    username: String @sql(type: "VARCHAR(40)", unique: true, nullable: true)
    email: String @sql(type: "VARCHAR(255)", unique: true, nullable: true)
    isEmailVerified: Boolean @sql(type: "BOOLEAN", default: "FALSE")
    phoneCallingCode: String @sql(type: "VARCHAR(50)", nullable: true)
    phoneNumber: String @sql(type: "VARCHAR(50)", nullable: true)
    isPhoneVerified: Boolean @sql(type: "BOOLEAN", default: "FALSE")
    isMfaEnabled: Boolean @sql(type: "BOOLEAN", default: "FALSE")
    hashedPassword: String @sql(type: "CHAR(60)", nullable: true) @private
    isTemp: Boolean @sql(type: "BOOLEAN", default: "FALSE") @private
    oauth: JSON @sql(nullable: true) @private
    oauthIdGithub: String
      @private
      @sql(
        type: "VARCHAR(256)"
        generated: "(oauth->>'$.github.id')"
        unique: true
        nullable: true
      )
    oauthIdGoogle: String
      @private
      @sql(
        type: "VARCHAR(256)"
        generated: "(oauth->>'$.google.id')"
        unique: true
        nullable: true
      )
    openAiKey: String @sql(type: "VARCHAR(256)", nullable: true) @private
    models: JSON @sql(type: "JSON")
    gptModels: JSON @sql(type: "JSON")
    dateUpdated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")

    id: String
    profilePictureUrl: String
    maskedOpenAiKey: String
    isOnboarded: Boolean
    hasPassword: Boolean
    hasOpenAiKey: Boolean
    hasGithubOAuth: Boolean
    hasGoogleOAuth: Boolean
    authTokens(agencyId: Int!): [AuthToken!]!
    agencies: [Agency!]!
  }
`

export const resolvers: ResolverDefs = {
  User: {
    id: resolver(async (user: UserSQL) => {
      return user.userId
    }),
    email: resolver(async (user: UserSQL, args, ctx) => {
      if (!ctx.isAuthenticated) {
        return null
      }
      if (ctx.session.userId !== user.userId) {
        return null
      }
      return user.email
    }),
    isEmailVerified: resolver(async (user: UserSQL, args, ctx) => {
      if (!ctx.isAuthenticated) {
        return null
      }
      if (ctx.session.userId !== user.userId) {
        return null
      }
      return user.isEmailVerified
    }),
    phoneCallingCode: resolver(async (user: UserSQL, args, ctx) => {
      if (!ctx.isAuthenticated) {
        return null
      }
      if (ctx.session.userId !== user.userId) {
        return null
      }
      return user.phoneCallingCode
    }),
    phoneNumber: resolver(async (user: UserSQL, args, ctx) => {
      if (!ctx.isAuthenticated) {
        return null
      }
      if (ctx.session.userId !== user.userId) {
        return null
      }
      return user.phoneNumber
    }),
    isPhoneVerified: resolver(async (user: UserSQL, args, ctx) => {
      if (!ctx.isAuthenticated) {
        return null
      }
      if (ctx.session.userId !== user.userId) {
        return null
      }
      return user.isPhoneVerified
    }),
    isMfaEnabled: resolver(async (user: UserSQL, args, ctx) => {
      if (!ctx.isAuthenticated) {
        return null
      }
      if (ctx.session.userId !== user.userId) {
        return null
      }
      return user.isMfaEnabled
    }),
    dateUpdated: resolver(async (user: UserSQL, args, ctx) => {
      if (!ctx.isAuthenticated) {
        return null
      }
      if (ctx.session.userId !== user.userId) {
        return null
      }
      return user.dateUpdated
    }),
    isOnboarded: resolver(async (user: UserSQL, args, ctx) => {
      if (!ctx.isAuthenticated) {
        return null
      }
      if (ctx.session.userId !== user.userId) {
        return null
      }
      // The user is considered to be onboarded when they have specified an apiBase for their inference server,
      // Examples:
      // http://localhost:1234
      // https://my-azure-openai-instance.openai.azure.com/
      // https://api.openai.com
      // It may or may not end with a trailing slash. We will normalize it and store it in DB with no trailing slash.
      // They must specify the protocol, but we check if it is http or https.
      return !!user.models?.length
    }),
    hasPassword: resolver(async (user: UserSQL, args, ctx) => {
      if (!ctx.isAuthenticated) {
        return null
      }
      if (ctx.session.userId !== user.userId) {
        return null
      }
      return !!user.hashedPassword
    }),
    profilePictureUrl: resolver(async (user: UserSQL) => {
      return null
    }),
    maskedOpenAiKey: resolver(async (user: UserSQL, args, ctx) => {
      if (!ctx.isAuthenticated) {
        return null
      }
      if (ctx.session.userId !== user.userId) {
        return null
      }
      if (!user.openAiKey) return null
      const firstPart = user?.openAiKey?.slice(0, 3) || ''
      const lastPart = user?.openAiKey?.slice(-4) || ''
      return firstPart + '...' + lastPart
    }),
    hasOpenAiKey: resolver(async (user: UserSQL, args, ctx) => {
      if (!ctx.isAuthenticated) {
        return null
      }
      if (ctx.session.userId !== user.userId) {
        return null
      }
      return !!user.openAiKey
    }),
    hasGithubOAuth: resolver(async (user: UserSQL, args, ctx) => {
      if (!ctx.isAuthenticated) {
        return null
      }
      if (ctx.session.userId !== user.userId) {
        return null
      }
      return !!user.oauth?.github
    }),
    hasGoogleOAuth: resolver(async (user: UserSQL, args, ctx) => {
      if (!ctx.isAuthenticated) {
        return null
      }
      if (ctx.session.userId !== user.userId) {
        return null
      }
      return !!user.oauth?.google
    }),
    authTokens: resolver(
      async (
        user: UserSQL,
        args: { agencyId: number },
        ctx: any,
      ): Promise<Array<AuthTokenSQL>> => {
        const { agencyId } = args

        // getTokensForAgency ensures ownership so no permission check is needed
        const tokens = await AuthTokenInterface.getActiveTokensForAgency(
          user.userId,
          agencyId,
        )
        return tokens
      },
    ),
    agencies: resolver(
      async (user: UserSQL, args: any, ctx: any): Promise<Array<AgencySQL>> => {
        if (!ctx.isAuthenticated) {
          return []
        }
        if (ctx.session.userId !== user.userId) {
          return []
        }

        const agencies = await AgencyInterface.getByUserId(user.userId)
        return agencies
      },
    ),
  },
}
