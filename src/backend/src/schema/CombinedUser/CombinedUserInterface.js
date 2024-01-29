// @flow

import { sqltag } from 'common/sql-template-tag'
import Config from 'common/src/Config.js'
import database from '../../mysql/database.js'
import ID from '../../utils/ID.js'

export default class CombinedUserInterface {
  static async create(): Promise<string> {
    const combinedUserId = ID.getUnique()
    const query = sqltag`
      INSERT INTO ${Config.dbPrefix}_CombinedUser (
        combinedUserId
      ) VALUES (
        UNHEX(${combinedUserId})
      );
    `
    await database.query(query)
    return combinedUserId
  }
}
