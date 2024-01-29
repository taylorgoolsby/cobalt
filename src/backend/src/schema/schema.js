// @flow

import gql from 'graphql-tag'
import GraphQLJSON from 'graphql-type-json'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { createIdDirective } from 'graphql-directive-id'
import privateDirective from 'graphql-directive-private'
import { paginationDirectiveTransform } from '../utils/pagination.js'
import * as Agency from './Agency/AgencySchema.js'
import * as AgencyConversation from './AgencyConversation/AgencyConversationSchema.js'
import * as Agent from './Agent/AgentSchema.js'
import * as AgentConversation from './AgentConversation/AgentConversationSchema.js'
import * as AuthToken from './AuthToken/AuthTokenSchema.js'
import * as Block from './Block/BlockSchema.js'
import * as Viewer from './Viewer/ViewerSchema.js'
import * as Version from './Version/VersionSchema.js'
import * as CombinedUser from './CombinedUser/CombinedUserSchema.js'
import * as User from './User/UserSchema.js'
import * as UsageLog from './UsageLog/UsageLogSchema.js'
import * as DataTransferLog from './DataTransferLog/DataTransferLogSchema.js'
import * as File from './File/FileSchema.js'
import * as Instruction from './Instruction/InstructionSchema.js'
import * as Message from './Message/MessageSchema.js'
import * as Mutation from '../mutation/Mutation.js'
import type { ResolverDefs } from '../utils/resolver.js'
import resolver from '../utils/resolver.js'
import createViewer from '../utils/createViewer.js'
import ChatGPTRest from '../rest/ChatGPTRest.js'
import UserInterface from './User/UserInterface.js'

const { idDirectiveTransformer } = createIdDirective('id')
const { privateDirectiveTransform } = privateDirective('private')

export const typeDefs: any = gql`
  scalar JSON

  directive @sql(
    unicode: Boolean
    auto: Boolean
    default: String
    index: Boolean
    nullable: Boolean
    primary: Boolean
    type: String
    unique: Boolean
    generated: String
    constraints: String
  ) on OBJECT | FIELD_DEFINITION

  # See graphql-directive-id
  directive @id(from: [String], name: String) on OBJECT

  # See graphql-directive-private
  directive @private on OBJECT | FIELD_DEFINITION

  # See graphql-directive-pagination
  directive @pagination on FIELD_DEFINITION

  ${Agency.typeDefs}
  ${AgencyConversation.typeDefs}
  ${Agent.typeDefs}
  ${AgentConversation.typeDefs}
  ${AuthToken.typeDefs}
  ${Block.typeDefs}
  ${Viewer.typeDefs}
  ${Version.typeDefs}
  ${CombinedUser.typeDefs}
  ${User.typeDefs}
  ${UsageLog.typeDefs}
  ${DataTransferLog.typeDefs}
  ${File.typeDefs}
  ${Instruction.typeDefs}
  ${Message.typeDefs}
  ${Mutation.typeDefs}

  type Query {
    viewer(sessionToken: String): Viewer
  }
`

// $FlowFixMe
export const resolvers: ResolverDefs = {
  Query: {
    viewer: resolver(async (obj, args, ctx) => {
      // Perform auth using args.sessionToken.
      const viewer = await createViewer(args.sessionToken, ctx)

      // Update gptModels whenever a user logs in:

      try {
        if (viewer?.userId) {
          const user = await UserInterface.getUser(viewer.userId)
          if (user?.openAiKey) {
            // Sometimes the OpenAI call to get models fails, so this is why it is denormalized
            // and in try-catch block.
            const models = await ChatGPTRest.getAvailableModels(user.openAiKey)
            await UserInterface.updateGptModels(user.userId, models)
          }
        }
      } catch (err) {
        console.error(err)
      }

      return viewer
    }),
  },
  ...Agency.resolvers,
  ...AgencyConversation.resolvers,
  ...Agent.resolvers,
  ...AgentConversation.resolvers,
  ...AuthToken.resolvers,
  ...Block.resolvers,
  ...Viewer.resolvers,
  ...Version.resolvers,
  ...CombinedUser.resolvers,
  ...User.resolvers,
  ...UsageLog.resolvers,
  ...DataTransferLog.resolvers,
  ...File.resolvers,
  ...Instruction.resolvers,
  ...Message.resolvers,
  ...Mutation.resolvers,
  JSON: GraphQLJSON,
}

let _schema: any = makeExecutableSchema({
  typeDefs,
  resolvers,
})

_schema = idDirectiveTransformer(_schema)
_schema = paginationDirectiveTransform(_schema, resolvers)
_schema = privateDirectiveTransform(_schema)

// console.log('printSchemaWithDirectives(schema)', printSchemaWithDirectives(_schema))

export const schema: any = _schema
