// @flow

import type { UsageLogSQL } from './UsageLogSchema.js'
import ID from '../../utils/ID.js'
import { sqltag } from 'common/sql-template-tag'
import Config from 'common/src/Config.js'
import database from '../../mysql/database.js'
import TimeUtils from '../../utils/TimeUtils.js'
import { operation } from './UsageLogSchema.js'

export default class UsageLogInterface {
  static async countsInMonth(
    userId: string,
    isoString: string,
  ): Promise<{ [operation: string]: number }> {
    const startTime = TimeUtils.toSQLfromISO(TimeUtils.startOfMonth(isoString))
    const endTime = TimeUtils.toSQLfromISO(TimeUtils.endOfMonth(isoString))

    const query = sqltag`
      SELECT operation, COUNT(*) AS counts
      FROM ${Config.dbPrefix}_UsageLog
      WHERE userId = UNHEX(${userId})
      AND ${startTime} <= dateCreated
      AND dateCreated <= ${endTime}
      GROUP BY operation;
    `
    const rows = await database.query(query)
    const result = {
      get: 0,
      set: 0,
    }
    if (rows[0]) {
      result[rows[0].operation.toLowerCase()] = rows[0].counts
    }
    if (rows[1]) {
      result[rows[1].operation.toLowerCase()] = rows[1].counts
    }
    return result
  }

  static async earliestMonth(userId: string): Promise<?string> {
    const query = sqltag`
      SELECT dateCreated
      FROM ${Config.dbPrefix}_UsageLog
      WHERE userId = UNHEX(${userId})
      ORDER BY dateCreated ASC
      LIMIT 1;
    `
    const rows = await database.query(query)
    if (rows[0]?.dateCreated) {
      return TimeUtils.toISOfromSQL(rows[0]?.dateCreated)
    } else {
      return null
    }
  }

  /*
    This query will join SET and DEL records together to calculate the lifetime.
    Any SET records which have not yet been deleted will use CURRENT_TIMESTAMP
    to calculate their ongoing lifetime.
  * */
  static async buildSetRecordsWithDateDeletedQuery(): Promise<any> {
    /*
    SELECT
    SUM(
      (keyByteLength + valueByteLength) * lifeTimeSeconds
    ) AS byteSeconds
    FROM (
      SELECT oset.*,
      GREATEST(IFNULL(odel.dateCreated, CURRENT_TIMESTAMP) - oset.dateCreated, 1) AS lifetimeSeconds
      FROM local_UsageLog AS oset
      LEFT JOIN local_UsageLog AS odel
      ON oset.keyValuePairId = odel.keyValuePairId
      AND oset.operation = 'SET'
      AND odel.operation = 'DEL'
      WHERE oset.operation = 'SET'
    ) AS setRecords
    GROUP BY userId;
    * */
    const query = sqltag`
      SELECT oset.*, 
      GREATEST(IFNULL(odel.dateCreated, CURRENT_TIMESTAMP) - oset.dateCreated, 1) AS lifetimeSeconds
      FROM ${Config.dbPrefix}_UsageLog AS oset
      LEFT JOIN ${Config.dbPrefix}_UsageLog AS odel
      ON oset.keyValuePairId = odel.keyValuePairId
      AND oset.operation = 'SET'
      AND odel.operation = 'DEL'
      WHERE oset.operation = 'SET';
    `
    return query
  }

  static async recordGet(
    userId: string,
    projectId: string,
    keyValuePairId: ?string,
    key: string,
    value: ?Buffer,
  ): Promise<string> {
    const usageLogId = ID.getUnique()
    const query = sqltag`
      INSERT INTO ${Config.dbPrefix}_UsageLog (
        usageLogId,
        userId,
        projectId,
        keyValuePairId,
        operation,
        keyByteLength,
        valueByteLength
      ) VALUES (
        UNHEX(${usageLogId}),
        UNHEX(${userId}),
        UNHEX(${projectId}),
        UNHEX(${keyValuePairId}),
        ${operation.GET},
        ${key.length},
        ${value?.length ?? 0}
      );
    `
    await database.query(query)
    return usageLogId
  }

  static async recordSet(
    userId: string,
    projectId: string,
    keyValuePairId: string,
    key: string, // ascii
    value: Buffer,
  ): Promise<string> {
    const usageLogId = ID.getUnique()
    const query = sqltag`
      INSERT INTO ${Config.dbPrefix}_UsageLog (
        usageLogId,
        userId,
        projectId,
        keyValuePairId,
        operation,
        keyByteLength,
        valueByteLength
      ) VALUES (
        UNHEX(${usageLogId}),
        UNHEX(${userId}),
        UNHEX(${projectId}),
        UNHEX(${keyValuePairId}),
        ${operation.SET},
        ${key.length},
        ${value.length}
      );
    `
    await database.query(query)
    return usageLogId
  }

  static async recordDelete(
    userId: string,
    projectId: string,
    keyValuePairId: ?string,
    key: string, // ascii
    value: ?Buffer,
  ): Promise<string> {
    const usageLogId = ID.getUnique()
    const query = sqltag`
      INSERT INTO ${Config.dbPrefix}_UsageLog (
        usageLogId,
        userId,
        projectId,
        keyValuePairId,
        operation,
        keyByteLength,
        valueByteLength
      ) VALUES (
        UNHEX(${usageLogId}),
        UNHEX(${userId}),
        UNHEX(${projectId}),
        UNHEX(${keyValuePairId}),
        ${operation.DEL},
        ${key.length},
        ${value?.length ?? 0}
      );
    `
    await database.query(query)
    return usageLogId
  }
}
