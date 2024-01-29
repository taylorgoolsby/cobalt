// @flow

import gql from 'graphql-tag'
import { unpackSession } from '../utils/Token.js'
import createViewer from '../utils/createViewer.js'
import AgencyInterface from '../schema/Agency/AgencyInterface.js'

type DeleteAgencyInput = {
  sessionToken: string,
  agencyId: number,
}

type DeleteAgencyResponse = {
  success: boolean,
  viewer: any,
}

export const typeDefs: any = gql`
  input DeleteAgencyInput {
    sessionToken: String!
    agencyId: Int!
  }

  type DeleteAgencyResponse {
    success: Boolean!
    viewer: Viewer!
  }
`

export async function resolver(
  _: any,
  args: { input: DeleteAgencyInput },
  ctx: any,
): Promise<DeleteAgencyResponse> {
  const { sessionToken, agencyId } = args.input
  const session = await unpackSession(sessionToken, ctx)

  // Verify agencyId belongs to session userId
  const agency = await AgencyInterface.getOwned(agencyId, session.userId)
  if (!agency) {
    throw new Error('Unauthorized')
  }

  // This deletes all versions of an agency:
  await AgencyInterface.softDelete(agency.versionId)

  return {
    success: true,
    viewer: await createViewer(sessionToken, ctx),
  }
}
