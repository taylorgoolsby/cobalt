// @flow

import gql from 'graphql-tag'
import { unpackSessionToken } from '../utils/Token.js'
import type { AgentSQL } from '../schema/Agent/AgentSchema.js'
import type { AgencySQL } from '../schema/Agency/AgencySchema.js'
import AgencyInterface from '../schema/Agency/AgencyInterface.js'
import AgentInterface from '../schema/Agent/AgentInterface.js'

type UpdateAgencyInput = {
  sessionToken: string,
  agencyId: number,
  agents?: Array<AgentSQL>,
}

type UpdateAgencyResponse = {
  success: boolean,
  agency: AgencySQL,
}

export const typeDefs: any = gql`
  input UpdateAgencyInput {
    sessionToken: String!
    agencyId: Int!
    agents: JSON
  }

  type UpdateAgencyResponse {
    success: Boolean!
    agency: Agency!
  }
`

export async function resolver(
  _: any,
  args: { input: UpdateAgencyInput },
  ctx: any,
): Promise<UpdateAgencyResponse> {
  const { sessionToken, agencyId, agents } = args.input
  const session = await unpackSessionToken(sessionToken, ctx)

  const agency = await AgencyInterface.getOwned(agencyId, session.userId)
  if (!agency) {
    throw new Error('Unauthorized')
  }

  if (agents) {
    // update agents, probably the ordering changed
    const agentIds = agents.map((agent) => agent.agentId)
    await AgentInterface.updateOrdering(agencyId, agentIds)
  }

  return {
    success: true,
    agency,
  }
}
