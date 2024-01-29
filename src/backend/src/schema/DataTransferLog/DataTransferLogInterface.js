// @flow

import ID from '../../utils/ID.js'
import { sqltag } from 'common/sql-template-tag'
import Config from 'common/src/Config.js'
import database from '../../mysql/database.js'

export default class DataTransferLogInterface {
  static async insert(
    clientId: string,
    connectionId: string,
    requestId: string,
    bytesIn: number,
    bytesOut: number,
  ): Promise<string> {
    const dataTransferLogId = ID.getUnique()
    const query = sqltag`
      INSERT INTO ${Config.dbPrefix}_DataTransferLog (
        dataTransferLogId,
        clientId,
        connectionId,
        requestId,
        bytesIn,
        bytesOut
      ) VALUES (
        UNHEX(${dataTransferLogId}),
        UNHEX(${clientId}),
        UNHEX(${connectionId}),
        UNHEX(${requestId}),
        ${bytesIn},
        ${bytesOut}
      );
    `
    await database.query(query)
    return dataTransferLogId
  }
}
