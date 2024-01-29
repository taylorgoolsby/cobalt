// @flow

import gql from 'graphql-tag'
import { unpackSession } from '../utils/Token.js'
import type { AgencySQL } from '../schema/Agency/AgencySchema.js'
import UserInterface from '../schema/User/UserInterface.js'
import AgencyInterface from '../schema/Agency/AgencyInterface.js'
import AgentInterface from '../schema/Agent/AgentInterface.js'
import AgencyConversationInterface from '../schema/AgencyConversation/AgencyConversationInterface.js'
import InstructionInterface from '../schema/Instruction/InstructionInterface.js'
import nonMaybe from 'non-maybe'
import createViewer from '../utils/createViewer.js'

type DeleteAgentInput = {
  sessionToken: string,
  agentId: number,
}

type DeleteAgentResponse = {
  success: boolean,
  agency: AgencySQL,
  viewer: any,
}

export const typeDefs: any = gql`
  input DeleteAgentInput {
    sessionToken: String!
    agentId: Int!
  }

  type DeleteAgentResponse {
    success: Boolean!
    agency: Agency!
    viewer: Viewer!
  }
`

export async function resolver(
  _: any,
  args: { input: DeleteAgentInput },
  ctx: any,
): Promise<DeleteAgentResponse> {
  const { sessionToken, agentId } = args.input
  const session = await unpackSession(sessionToken, ctx)

  const user = await UserInterface.getUser(session.userId)

  if (!user) {
    throw new Error('Unauthorized')
  }

  const agent = await AgentInterface.get(agentId)
  if (!agent) {
    throw new Error('Unauthorized')
  }

  // Make sure agency of agent belongs to user
  // so agent belongs to user
  const agency = await AgencyInterface.getOwned(agent.agencyId, user.userId)
  if (!agency) {
    throw new Error('Unauthorized')
  }

  if (agent.isManager) {
    throw new Error(
      'There must be one manager for the agency, so it cannot be deleted.',
    )
  }

  let latestAgencyId = agency.agencyId
  let latestAgentId = agentId
  const chats = await AgencyConversationInterface.getForVersion(agency.agencyId)
  if (chats.length) {
    const cloneRes = await AgencyInterface.insertNewVersion(agency.agencyId)
    latestAgencyId = cloneRes.latestAgencyId
    latestAgentId = cloneRes.clonedAgentIdMap?.[agentId] ?? agentId
  }

  // If a clone was made, it will soft delete the agent in the newest version.
  // When another version is created, soft deleted agents are not carried over to the new version.
  await AgentInterface.delete(latestAgentId)

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
