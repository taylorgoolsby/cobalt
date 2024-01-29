// @flow

import { sqltag } from 'common/sql-template-tag'
import Config from 'common/src/Config.js'
import database from '../../mysql/database.js'
import type { AgencySQL } from './AgencySchema.js'
import ID from '../../utils/ID.js'
import AgentInterface from '../Agent/AgentInterface.js'

export default class AgencyInterface {
  static async getActive(agencyId: number): Promise<?AgencySQL> {
    const query = sqltag`
      SELECT * FROM ${Config.dbPrefix}_Agency
      WHERE agencyId = ${agencyId}
      AND NOT isDeleted;
    `
    const rows = await database.query(query)
    return rows[0]
  }

  static async getOwnedLatest(
    agencyId: number,
    userId: string,
  ): Promise<?AgencySQL> {
    const query = sqltag`
      SELECT * FROM ${Config.dbPrefix}_Agency
      WHERE agencyId IN (
        SELECT agencyId 
        FROM ${Config.dbPrefix}_Agency
        WHERE versionId IN (
          SELECT versionId
          FROM ${Config.dbPrefix}_Agency
          WHERE agencyId = ${agencyId}
        )
        ORDER BY dateCreated DESC
        LIMIT 1
      )
      AND userId = UNHEX(${userId})
      AND NOT isDeleted;
    `
    const rows = await database.query(query)
    return rows[0]
  }

  static async getOwned(agencyId: number, userId: string): Promise<?AgencySQL> {
    const query = sqltag`
      SELECT * FROM ${Config.dbPrefix}_Agency
      WHERE agencyId = ${agencyId}
      AND userId = UNHEX(${userId})
      AND NOT isDeleted;
    `
    const rows = await database.query(query)
    return rows[0]
  }

  static async getOwnedByLookupId(
    lookupId: string,
    userId: string,
  ): Promise<?AgencySQL> {
    const query = sqltag`
      SELECT * FROM ${Config.dbPrefix}_Agency
      WHERE lookupId = UNHEX(${lookupId})
      AND userId = UNHEX(${userId})
      AND NOT isDeleted;
    `
    const rows = await database.query(query)
    return rows[0]
  }

  static async getByUserId(userId: string): Promise<Array<AgencySQL>> {
    const query = sqltag`
      SELECT * 
      FROM ${Config.dbPrefix}_Agency
      WHERE agencyId IN (
        SELECT MAX(agencyId)
        FROM ${Config.dbPrefix}_Agency
        WHERE userId = UNHEX(${userId})
        AND NOT isDeleted
        GROUP BY versionId
      )
      ORDER BY name ASC;
    `
    const rows = await database.query(query)
    return rows
  }

  static async getAdminById(agencyId: number): Promise<AgencySQL> {
    const query = sqltag`
      SELECT * FROM ${Config.dbPrefix}_Agency
      WHERE agencyId = ${agencyId};
    `
    const rows = await database.query(query)
    return rows[0]
  }

  static async getActiveVersions(versionId: number): Promise<Array<AgencySQL>> {
    const query = sqltag`
      SELECT * FROM ${Config.dbPrefix}_Agency
      WHERE versionId = ${versionId}
      AND NOT isDeleted
      ORDER BY agencyId DESC;
    `
    const rows = await database.query(query)
    return rows
  }

  static async insertFirstVersion(
    userId: string,
    name: ?string,
    description: ?string,
  ): Promise<[number, string]> {
    const lookupId = ID.getUnique()
    const query = sqltag`
      INSERT INTO ${Config.dbPrefix}_Agency (
        lookupId,
        userId,
        name,
        description
      ) VALUES (
        UNHEX(${lookupId}),
        UNHEX(${userId}),
        ${name ?? ''},
        ${description ?? ''}
      );
    `
    const res = await database.query(query)

    const agencyId = res.insertId

    const updateQuery = sqltag`
      UPDATE ${Config.dbPrefix}_Agency SET
      versionId = ${agencyId},
      dateUpdated = CURRENT_TIMESTAMP
      WHERE agencyId = ${agencyId};
    `
    await database.query(updateQuery)

    return [agencyId, lookupId]
  }

  static async insertNewVersion(previousAgencyId: number): Promise<{
    latestAgencyId: number,
    clonedAgentIdMap?: { [agentId: number]: number },
  }> {
    const lookupId = ID.getUnique()
    const query = sqltag`
      INSERT INTO ${Config.dbPrefix}_Agency (
        lookupId,
        versionId,
        userId,
        name,
        description,
        isPrivate
      )
      SELECT
        UNHEX(${lookupId}) AS lookupId,
        versionId,
        userId,
        name,
        description,
        isPrivate
      FROM ${Config.dbPrefix}_Agency
      WHERE agencyId IN (
        SELECT
          MAX(agencyId) AS agencyId
        FROM ${Config.dbPrefix}_Agency
        WHERE versionId IN (
          SELECT versionId
          FROM ${Config.dbPrefix}_Agency
          WHERE agencyId = ${previousAgencyId}
        )
        ORDER BY agencyId DESC
      );
    `

    const res = await database.query(query)

    const agencyId = res.insertId
    // agencyId is 0 if the SELECT above returns no rows.

    if (!agencyId) {
      // Race condition:
      // If two users try to create a new version at the same time, the first one will succeed and the second one will fail.
      // Instead, return the agencyId of the latest version.
      // This will allow changes to still be applied on the latest version.
      // This call must return the latest version ID.
      // In a race condition, both callers will receive a new ID,
      // but only one of them should continue with cloning.
      // Both callers should then apply their changes on the latest version.

      // Do not clone, but return latest version ID:
      const query = sqltag`
        SELECT agencyId
        FROM ${Config.dbPrefix}_Agency
        WHERE versionId IN (
          SELECT versionId
          FROM ${Config.dbPrefix}_Agency
          WHERE agencyId = ${previousAgencyId}
        )
        ORDER BY agencyId DESC
        LIMIT 1;
      `
      const rows = await database.query(query)
      return {
        latestAgencyId: rows[0].agencyId,
      }
    } else {
      // Complete cloning:
      // Recreate all agents under the new version:
      const agents = await AgentInterface.getAll(previousAgencyId)
      const clonedAgentIdMap: { [number]: number } = {}
      for (const agent of agents) {
        if (agent.isDeleted) {
          // do not copy over deleted agents
          continue
        }

        const nextAgentId = await AgentInterface.clone(agencyId, agent)

        clonedAgentIdMap[agent.agentId] = nextAgentId
      }
      return {
        latestAgencyId: agencyId,
        clonedAgentIdMap,
      }
    }
  }

  static async softDelete(agencyVersionId: number): Promise<void> {
    const query = sqltag`
      UPDATE ${Config.dbPrefix}_Agency SET
      isDeleted = TRUE
      WHERE versionId = ${agencyVersionId}
      AND NOT isDeleted;
    `
    await database.query(query)
  }
}
