// @flow

import gql from 'graphql-tag'
import { unpackSession } from '../utils/Token.js'
import AgencyInterface from '../schema/Agency/AgencyInterface.js'
import type { UserSQL } from '../schema/User/UserSchema.js'
import UserInterface from '../schema/User/UserInterface.js'
import nonMaybe from 'non-maybe'
import AuthTokenInterface from '../schema/AuthToken/AuthTokenInterface.js'
import { resolver as CreateAgentResolver } from './CreateAgentResolver.js'
import AgentInterface from '../schema/Agent/AgentInterface.js'
import type { InstructionSQL } from '../schema/Instruction/InstructionSchema.js'
import Config from 'common/src/Config.js'

type CreateAgencyInput = {
  sessionToken: string,
  name: string,
}

type CreateAgencyResponse = {
  success: boolean,
  agencyId: number,
  lookupId: string,
  user: UserSQL,
}

export const typeDefs: any = gql`
  input CreateAgencyInput {
    sessionToken: String!
    name: String!
  }

  type CreateAgencyResponse {
    success: Boolean!
    agencyId: Int!
    lookupId: String!
    user: User!
  }
`

export async function resolver(
  _: any,
  args: { input: CreateAgencyInput },
  ctx: any,
): Promise<CreateAgencyResponse> {
  const { sessionToken, name } = args.input
  const session = await unpackSession(sessionToken, ctx)

  const user = await UserInterface.getUser(session.userId)
  if (!user) {
    throw new Error('Unauthorized')
  }

  const isTrialKey = user.openAiKey === Config.openAiPublicTrialKey
  if (isTrialKey) {
    // Rate limit to 1 agencies per user:
    const existingAgencies = await AgencyInterface.getByUserId(session.userId)
    if (existingAgencies.length >= 1) {
      throw new Error('When using the trial key, you can only create 1 agency.')
    }
  } else {
    // Rate limit to 2 agencies per user:
    const existingAgencies = await AgencyInterface.getByUserId(session.userId)
    if (existingAgencies.length >= 2) {
      throw new Error('You can only create 2 agencies at this time.')
    }
  }

  // When the first version is created, the agencyId === versionId
  const [agencyId, lookupId] = await AgencyInterface.insertFirstVersion(
    session.userId,
    name,
  )

  await AuthTokenInterface.insert(agencyId, 'default', session.userId)

  const defaultManagerInstructionClauses = [
    'You are the manager of this agency.',
    'You will be receiving messages from the client as well as other agents in the agency.',
    "When you receive a message from the client, you should reply back to the client, and then decide how to meet the client's request by talking to the other agents while making sure to pass along all important information.",
    'When the other agents report back to you, you should check that consensus has been reached among you all before sending a reply back to the client.',
    //
    'You will forward messages from the end user to the other agents in the agency.',
    'You will forward messages from the other agents back to the end user.',
  ]

  const instructions: Array<InstructionSQL> =
    defaultManagerInstructionClauses.map((clause) => ({
      instructionId: '',
      agentId: 0,
      clause,
      orderIndex: 0,
      canEdit: true,
      isInternal: false,
      isDeleted: false,
      dateUpdated: '',
      dateCreated: '',
    }))

  instructions[0].canEdit = false

  const { agentId } = await CreateAgentResolver(
    null,
    {
      input: {
        sessionToken: sessionToken,
        agencyId,
        model: user.gptModels[0],
        name: 'Manager',
        isManager: true,
        orderIndex: 0,
        instructions,
      },
    },
    ctx,
    { agencyCreation: true },
  )

  // Do not allow the first instruction, "You are the manager of this agency." to be editable:
  // const publicInstructions = await InstructionInterface.getAll(agentId)
  // await InstructionInterface.updateCanEdit(
  //   publicInstructions[0].instructionId,
  //   false,
  // )

  await AgentInterface.updateIsManager(agentId, true)

  return {
    success: true,
    agencyId,
    lookupId,
    user: nonMaybe(await UserInterface.getUser(session.userId)),
  }
}
