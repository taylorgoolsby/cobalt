// @flow

import gql from 'graphql-tag'
import { unpackSessionToken } from '../utils/Token.js'
import type { InstructionSQL } from '../schema/Instruction/InstructionSchema.js'
import AgencyInterface from '../schema/Agency/AgencyInterface.js'
import AgentInterface from '../schema/Agent/AgentInterface.js'
import UserInterface from '../schema/User/UserInterface.js'
import InstructionInterface from '../schema/Instruction/InstructionInterface.js'
import type { AgencySQL } from '../schema/Agency/AgencySchema.js'
import MessageInterface from '../schema/Message/MessageInterface.js'
import AgencyConversationInterface from '../schema/AgencyConversation/AgencyConversationInterface.js'
import { resolver as CreateAgentResolver } from './CreateAgentResolver.js'
import nonMaybe from 'non-maybe'
import createViewer from '../utils/createViewer.js'

type UpdateAgentInput = {
  sessionToken: string,
  agentId: number,
  agencyId: number,
  name: string,
  model: string,
  orderIndex: number,
  instructions: Array<InstructionSQL>,
}

type UpdateAgentResponse = {
  success: boolean,
  agency: AgencySQL,
  viewer: any,
}

export const typeDefs: any = gql`
  input UpdateAgentInput {
    sessionToken: String!
    agentId: Int!
    agencyId: Int!
    name: String!
    model: String!
    orderIndex: Int!
    instructions: JSON!
  }

  type UpdateAgentResponse {
    success: Boolean!
    agency: Agency!
    viewer: Viewer!
  }
`

export async function resolver(
  _: any,
  args: { input: UpdateAgentInput },
  ctx: any,
): Promise<UpdateAgentResponse> {
  const {
    sessionToken,
    agencyId,
    agentId,
    name,
    model,
    orderIndex,
    instructions,
  } = args.input
  const session = await unpackSessionToken(sessionToken, ctx)

  if (!Array.isArray(instructions)) {
    throw new Error('Instructions must be an array')
  }

  if (instructions.length < 1) {
    throw new Error('There must be at least one instruction.')
  }

  const user = await UserInterface.getUser(session.userId)

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Make sure agency belongs to user
  const agency = await AgencyInterface.getOwned(agencyId, user.userId)
  if (!agency) {
    throw new Error('Unauthorized')
  }

  const existingAgent = await AgentInterface.get(agentId)
  if (!existingAgent) {
    throw new Error('Agent not found')
  }

  // Make sure agent belongs to agency
  if (existingAgent.agencyId !== agencyId) {
    throw new Error('Unauthorized')
  }

  const internalInstructions = await InstructionInterface.getAllInternalOnly(
    agentId,
  )

  for (let i = 0; i < instructions.length; i++) {
    const instruction = instructions[i]

    // Remove typename and id from instructions since apollo adds these in during the round trip.
    // $FlowFixMe
    delete instruction.__typename
    // $FlowFixMe
    delete instruction.id

    // prevent client from making internal instructions:
    instruction.isInternal = false

    // prevent client from making non-editable instructions:
    instruction.canEdit = true

    // Force orderIndex to be the same as the order of the instructions array.
    instruction.orderIndex = internalInstructions.length + i
  }

  // Since instruction updating uses upsert, need to verify all instructions belong to agent.
  const existingInstructions = await InstructionInterface.getAll(agentId)

  const existingMap: { [string]: InstructionSQL } = {}
  for (const instruction of existingInstructions) {
    existingMap[instruction.instructionId] = instruction
  }

  // Any instruction which is in existingInstruction is included for update so that orderings can be updated.
  const updateInstructions = instructions.filter(
    (instruction: InstructionSQL) => {
      return existingInstructions.some(
        (existingInstruction: InstructionSQL) => {
          return instruction.instructionId === existingInstruction.instructionId
        },
      )
    },
  )

  const createInstructions = instructions.filter(
    (instruction: InstructionSQL) => {
      return !existingInstructions.some(
        (existingInstruction: InstructionSQL) => {
          return instruction.instructionId === existingInstruction.instructionId
        },
      )
    },
  )

  const deleteInstructions = existingInstructions.filter(
    (instruction: InstructionSQL) => {
      return !instructions.some((newInstruction: InstructionSQL) => {
        return instruction.instructionId === newInstruction.instructionId
      })
    },
  )

  for (const instruction of updateInstructions) {
    if (
      !existingMap[instruction.instructionId].canEdit &&
      (existingMap[instruction.instructionId].orderIndex !==
        instruction.orderIndex ||
        existingMap[instruction.instructionId].clause !== instruction.clause)
    ) {
      throw new Error('You cannot change an instruction that you cannot edit.')
    }
  }

  for (const instruction of deleteInstructions) {
    if (!instruction.canEdit) {
      throw new Error('You cannot delete an instruction that you cannot edit.')
    }
  }

  // Todo: Consider preventing the name of the manager agent from changing.
  // if (existingAgent.isManager && existingAgent.name !== name) {
  //   throw new Error('The names of agents is important and cannot be changed.')
  // }

  // only create a new version if there are chats on the existing version.
  let latestAgencyId = agency.agencyId
  let latestAgentId = agentId
  const chats = await AgencyConversationInterface.getForVersion(agency.agencyId)
  if (chats.length) {
    const cloneRes = await AgencyInterface.insertNewVersion(agency.agencyId)
    latestAgencyId = cloneRes.latestAgencyId
    latestAgentId = cloneRes.clonedAgentIdMap?.[agentId] ?? agentId
  }

  if (existingAgent.name !== name || existingAgent.model !== model) {
    await AgentInterface.update(latestAgentId, name, model, orderIndex)
  }

  await InstructionInterface.deleteBatch(latestAgentId, deleteInstructions)
  await InstructionInterface.insertBatch(latestAgentId, createInstructions)
  // Update clause and orderIndex:
  await InstructionInterface.updateBatch(latestAgentId, updateInstructions)

  const updatedAgency = await AgencyInterface.getOwned(
    latestAgencyId,
    user.userId,
  )

  return {
    success: true,
    agency: nonMaybe(updatedAgency),
    viewer: await createViewer(sessionToken, ctx),
  }
}
