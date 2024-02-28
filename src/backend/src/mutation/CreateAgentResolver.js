// @flow

import type { InstructionSQL } from '../schema/Instruction/InstructionSchema.js'
import gql from 'graphql-tag'
import { unpackSession } from '../utils/Token.js'
import InferenceRest from '../rest/InferenceRest.js'
import UserInterface from '../schema/User/UserInterface.js'
import AgentInterface from '../schema/Agent/AgentInterface.js'
import InstructionInterface from '../schema/Instruction/InstructionInterface.js'
import AgencyInterface from '../schema/Agency/AgencyInterface.js'
import type { AgencySQL } from '../schema/Agency/AgencySchema.js'
import AgencyConversationInterface from '../schema/AgencyConversation/AgencyConversationInterface.js'
import nonMaybe from 'non-maybe'
import createViewer from '../utils/createViewer.js'
import Config from 'common/src/Config.js'

type CreateAgentInput = {
  sessionToken: string,
  agencyId: number,
  model: string,
  name: string,
  // Agents are ordered DESC so that new agents can be added to the top
  // without the need to update all the other agents' orderIndex.
  orderIndex: number,
  instructions: Array<InstructionSQL>,
}

type CreateAgentResponse = {
  success: boolean,
  agency: AgencySQL,
  agentId: number,
  viewer: any,
}

export const typeDefs: any = gql`
  input CreateAgentInput {
    sessionToken: String!
    agencyId: Int!
    model: String!
    name: String!
    orderIndex: Int!
    instructions: JSON!
  }

  type CreateAgentResponse {
    success: Boolean!
    agency: Agency!
    agentId: Int!
    viewer: Viewer!
  }
`

export async function resolver(
  _: any,
  args: { input: CreateAgentInput },
  ctx: any,
  options?: ?{ agencyCreation?: boolean },
): Promise<CreateAgentResponse> {
  const { sessionToken, agencyId, model, name, orderIndex, instructions } =
    args.input
  const session = await unpackSession(sessionToken, ctx)

  if (!name) {
    throw new Error('Please enter an agent name.')
  }

  if (!Array.isArray(instructions)) {
    throw new Error('instructions should be an array.')
  }

  const user = await UserInterface.getUser(session.userId)

  if (!user) {
    throw new Error('Unauthorized')
  }

  const agency = await AgencyInterface.getOwned(agencyId, user.userId)
  if (!agency) {
    throw new Error('Unauthorized')
  }

  const isTrialKey = user.openAiKey === Config.openAiPublicTrialKey
  if (isTrialKey) {
    // Rate limit to 3 agents per agency:
    const agents = await AgentInterface.getAll(agencyId)
    if (agents.length >= 3) {
      throw new Error(
        'When using the trial key, you can only have 3 agents in your agency.',
      )
    }
  } else {
    // Rate limit to 5 agents per agency:
    const agents = await AgentInterface.getAll(agencyId)
    if (agents.length >= 5) {
      throw new Error('You can only have 5 agents per agency at this time.')
    }
  }

  // const availableModels = await ChatGPTRest.getAvailableModels(user.openAiKey)
  // if (!availableModels.includes(model)) {
  //   throw new Error('Invalid model.')
  // }

  // only create a new version if there are chats on the existing version.
  let latestAgencyId = agencyId
  const chats = await AgencyConversationInterface.getForVersion(agency.agencyId)
  if (chats.length) {
    const cloneRes = await AgencyInterface.insertNewVersion(agencyId)
    latestAgencyId = cloneRes.latestAgencyId
  }

  const agentId = await AgentInterface.insert(
    latestAgencyId,
    model,
    name,
    orderIndex,
  )

  const createInstructions: Array<InstructionSQL> = []

  if (!options?.agencyCreation) {
    createInstructions.push({
      instructionId: '',
      agentId: 0,
      clause: 'You will receive instructions from the manager.',
      orderIndex: 0,
      canEdit: false,
      isInternal: false,
      isDeleted: false,
      dateUpdated: '',
      dateCreated: '',
    })
  }

  for (let i = 0; i < instructions.length; i++) {
    const instruction = instructions[i]

    // prevent the client from assigning instructions to agents they don't own:
    instruction.agentId = agentId

    // prevent client from making internal instructions:
    instruction.isInternal = false

    // The first instruction is always non-editable:
    if (options?.agencyCreation && i !== 0) {
      // prevent client from making non-editable instructions:
      instruction.canEdit = true
    }

    // The first instruction from the client should be the
    // 'You will receive instructions from the manager.' instruction.
    if (i !== 0) {
      // User defined instructions are placed after the internal instructions:
      createInstructions.push(instruction)
    }
  }

  for (let i = 0; i < createInstructions.length; i++) {
    // When creating an agent, orderIndex in the provided instructions is ignored.
    createInstructions[i].orderIndex = i
  }

  if (!createInstructions.length) {
    throw new Error('There must be at least one instruction.')
  }

  // only the clause is used.
  await InstructionInterface.insertBatch(agentId, createInstructions)

  const updatedAgency = await AgencyInterface.getOwned(
    latestAgencyId,
    user.userId,
  )

  return {
    success: true,
    agency: nonMaybe(updatedAgency),
    agentId,
    viewer: await createViewer(sessionToken, ctx),
  }
}
