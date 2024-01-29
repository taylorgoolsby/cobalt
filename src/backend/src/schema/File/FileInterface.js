// @flow

import ID from '../../utils/ID.js'
import { sqltag } from 'common/sql-template-tag'
import Config from 'common/src/Config.js'
import database from '../../mysql/database.js'

export default class FileInterface {
  static async insert(
    storedName: string,
    metadata: { [string]: any },
  ): Promise<string> {
    const fileId = ID.getUnique()
    const query = sqltag`
      INSERT INTO ${Config.dbPrefix}_File (
        fileId,
        storedName,
        metadata
      ) VALUES (
        UNHEX(${fileId}),
        ${storedName},
        ${JSON.stringify(metadata)}
      );
    `
    await database.query(query)
    return fileId
  }
}
