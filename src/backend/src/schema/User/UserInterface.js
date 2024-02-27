// @flow

import type { UserSQL } from './UserSchema.js'
import type { TokenResGithub, UserResGithub } from '../../rest/GithubRest.js'
import ID from '../../utils/ID.js'
import { sqltag } from 'common/sql-template-tag'
import Config from 'common/src/Config.js'
import database from '../../mysql/database.js'
import type { TokenResGoogle, UserResGoogle } from '../../rest/GoogleRest.js'
import CombinedUserInterface from '../CombinedUser/CombinedUserInterface.js'
import deleteUndefinedFields from '../../utils/deleteUndefinedFields.js'
import Security from '../../utils/Security.js'

export default class UserInterface {
  static async getUser(userId: string): Promise<?UserSQL> {
    const query = sqltag`
      SELECT * FROM ${Config.dbPrefix}_User
      WHERE userId = UNHEX(${userId});
    `
    const rows = await database.query(query)
    return decryptUser(rows[0])
  }

  static async getByUsername(username: string): Promise<?UserSQL> {
    const query = sqltag`
      SELECT * FROM ${Config.dbPrefix}_User
      WHERE username = ${username};
    `
    const rows = await database.query(query)
    return decryptUser(rows[0])
  }

  static async getByEmail(email: string): Promise<?UserSQL> {
    const query = sqltag`
      SELECT * FROM ${Config.dbPrefix}_User
      WHERE email = ${email};
    `
    const rows = await database.query(query)
    return decryptUser(rows[0])
  }

  static async getByGithubId(id: number): Promise<?UserSQL> {
    const query = sqltag`
      SELECT * FROM ${Config.dbPrefix}_User
      WHERE oauthIdGithub = ${id};
    `
    const rows = await database.query(query)
    return decryptUser(rows[0])
  }

  static async getByGoogleId(id: string): Promise<?UserSQL> {
    const query = sqltag`
      SELECT * FROM ${Config.dbPrefix}_User
      WHERE oauthIdGoogle = ${id};
    `
    const rows = await database.query(query)
    return decryptUser(rows[0])
  }

  static async getMultiAccounts(userId: string): Promise<Array<UserSQL>> {
    const query = sqltag`
      SELECT * FROM ${Config.dbPrefix}_User
      WHERE combinedUserId IN (
        SELECT combinedUserId FROM ${Config.dbPrefix}_User
        WHERE userId = UNHEX(${userId})
      )
      ORDER BY dateCreated ASC;
    `
    const rows = await database.query(query)
    return rows.map((row) => decryptUser(row))
  }

  static async insert(
    email: string,
    hashedPassword: string,
    options?: { isTemp?: boolean },
  ): Promise<string> {
    let userId
    let combinedUserId

    const existingUser = await UserInterface.getByEmail(email)
    if (existingUser) {
      userId = existingUser.userId
      combinedUserId = existingUser.combinedUserId
    } else {
      userId = ID.getUnique()
      combinedUserId = await CombinedUserInterface.create()
    }

    const query = sqltag`
      INSERT INTO ${Config.dbPrefix}_User (
        userId,
        combinedUserId,
        email,
        hashedPassword,
        isTemp,
        gptModels,
        inferenceServerConfig
      ) VALUES (
        UNHEX(${userId}),
        UNHEX(${combinedUserId}),
        ${email},
        ${hashedPassword},
        ${!!options?.isTemp},
        ${JSON.stringify([])},
        ${JSON.stringify({})}
      );
    `
    await database.query(query)
    return userId
  }

  static async insertFromOauthGithub(
    tokenRes: TokenResGithub,
    userRes: UserResGithub,
    userEmail: string,
  ): Promise<string> {
    if (!userRes.id) {
      throw new Error('OAuth Error: Unable to find user.')
    }

    let userId = ID.getUnique()
    let combinedUserId = null
    let oauth = {
      github: {
        token: tokenRes,
        id: userRes.id,
        email: userEmail,
      },
    }
    const existingUser =
      (await UserInterface.getByGithubId(userRes.id)) ||
      (await UserInterface.getByEmail(userEmail))
    if (existingUser) {
      userId = existingUser.userId
      combinedUserId = existingUser.combinedUserId
      oauth = {
        ...existingUser.oauth,
        ...oauth,
      }
    } else {
      combinedUserId = await CombinedUserInterface.create()
    }

    if (!combinedUserId) {
      throw new Error('Failed to generate a combinedUserId.')
    }

    const query = sqltag`
      INSERT INTO ${Config.dbPrefix}_User (
        userId,
        combinedUserId,
        email,
        isEmailVerified,
        oauth,
        inferenceServerConfig,
        gptModels
      ) VALUES (
        UNHEX(${userId}),
        UNHEX(${combinedUserId}),
        ${userEmail},
        TRUE,
        ${JSON.stringify(oauth)},
        ${JSON.stringify([])},
        ${JSON.stringify({})}
      ) ON DUPLICATE KEY UPDATE -- generated unique column oauthId should collide
      oauth = VALUES(oauth),
      dateUpdated = CURRENT_TIMESTAMP;
    `

    const res = await database.query(query)

    return userId
  }

  static async insertFromOauthGoogle(
    tokenRes: TokenResGoogle,
    userRes: UserResGoogle,
    userEmail: string,
  ): Promise<string> {
    if (!userRes.id) {
      throw new Error('OAuth Error: Unable to find user.')
    }

    let userId = ID.getUnique()
    let combinedUserId = null
    let oauth = {
      google: {
        token: tokenRes,
        id: userRes.id,
        email: userEmail,
      },
    }
    const existingUser =
      (await UserInterface.getByGoogleId(userRes.id)) ||
      (await UserInterface.getByEmail(userEmail))
    if (existingUser) {
      userId = existingUser.userId
      combinedUserId = existingUser.combinedUserId
      oauth = {
        ...existingUser.oauth,
        ...oauth,
      }
    } else {
      combinedUserId = await CombinedUserInterface.create()
    }

    if (!combinedUserId) {
      throw new Error('Failed to generate a combinedUserId.')
    }

    const query = sqltag`
      INSERT INTO ${Config.dbPrefix}_User (
        userId,
        combinedUserId,
        email,
        isEmailVerified,
        oauth,
        inferenceServerConfig,
        gptModels
      ) VALUES (
        UNHEX(${userId}),
        UNHEX(${combinedUserId}),
        ${userEmail},
        TRUE,
        ${JSON.stringify(oauth)},
        ${JSON.stringify([])},
        ${JSON.stringify({})}
      ) ON DUPLICATE KEY UPDATE -- generated unique column oauthId should collide
      oauth = VALUES(oauth),
      dateUpdated = CURRENT_TIMESTAMP;
    `

    const res = await database.query(query)

    return userId
  }

  static async setInitialEmail(userId: string, email: string): Promise<void> {
    const query = sqltag`
      UPDATE ${Config.dbPrefix}_User SET
      email = ${email},
      dateUpdated = CURRENT_TIMESTAMP
      WHERE userId = UNHEX(${userId})
      AND email IS NULL;
    `
    await database.query(query)
  }

  static async setEmailVerified(
    userId: string,
    email: string,
    verified: boolean,
  ): Promise<void> {
    const query = sqltag`
      UPDATE ${Config.dbPrefix}_User SET
      isEmailVerified = ${verified},
      dateUpdated = CURRENT_TIMESTAMP
      WHERE userId = UNHEX(${userId})
      AND email = ${email};
    `
    await database.query(query)
  }

  static async updateSettings(
    userId: string,
    updateSet: Partial<UserSQL>,
  ): Promise<UserSQL> {
    const existingUser = await UserInterface.getUser(userId)
    if (!existingUser) {
      throw new Error('Cannot update because userId does not exist.')
    }

    const nextUser: UserSQL = {
      ...existingUser,
      ...deleteUndefinedFields(updateSet),
    }

    const username = validateUsername(nextUser.username)

    const existingEmail = await UserInterface.getByUsername(username)
    if (existingEmail && userId !== existingEmail.userId) {
      throw new Error('The username is already taken.')
    }

    const query = sqltag`
      UPDATE ${Config.dbPrefix}_User SET
      username = ${username},
      email = ${nextUser.email},
      phoneCallingCode = ${nextUser.phoneCallingCode},
      phoneNumber = ${nextUser.phoneNumber},
      isPhoneVerified = ${
        !!nextUser.phoneCallingCode && !!nextUser.phoneNumber
      }, -- phone registration flow should prevent setting unverified
      isMfaEnabled = ${nextUser.isMfaEnabled},
      hashedPassword = ${nextUser.hashedPassword},
      openAiKey = ${Security.encrypt(nextUser.openAiKey)},
      inferenceServerConfig = ${JSON.stringify(nextUser.inferenceServerConfig)},
      dateUpdated = CURRENT_TIMESTAMP
      WHERE userId = UNHEX(${userId});
    `
    await database.query(query)
    return nextUser
  }

  static async updateHashedPassword(
    userId: string,
    hashedPassword: string,
  ): Promise<void> {
    const query = sqltag`
      UPDATE ${Config.dbPrefix}_User SET
      hashedPassword = ${hashedPassword},
      dateUpdated = CURRENT_TIMESTAMP
      WHERE userId = UNHEX(${userId});
    `
    await database.query(query)
  }

  static async updateCombinedUserId(
    userId: string,
    combinedUserId: string,
  ): Promise<any> {
    const query = sqltag`
      UPDATE ${Config.dbPrefix}_User SET
      combinedUserId = UNHEX(${combinedUserId}),
      dateUpdated = CURRENT_TIMESTAMP
      WHERE userId = UNHEX(${userId});
    `
    await database.query(query)
  }

  static async updateGptModels(
    userId: string,
    gptModels: Array<string>,
  ): Promise<any> {
    const query = sqltag`
      UPDATE ${Config.dbPrefix}_User SET
      gptModels = ${JSON.stringify(gptModels)},
      dateUpdated = CURRENT_TIMESTAMP
      WHERE userId = UNHEX(${userId});
    `
    await database.query(query)
  }

  static async setTempFalse(userId: string): Promise<string> {
    const query = sqltag`
      UPDATE ${Config.dbPrefix}_User SET
      isTemp = FALSE,
      dateUpdated = CURRENT_TIMESTAMP
      WHERE userId = UNHEX(${userId})
      AND isTemp = TRUE;
    `
    await database.query(query)
    return userId
  }
}

function validateUsername(username: ?string, fix?: boolean): string {
  if (typeof username !== 'string') {
    username = ''
    if (!fix) {
      throw new Error('Username must be a string.')
    }
  }

  if (!username) {
    if (!fix) {
      throw new Error('Username cannot be blank.')
    }
  }

  if (username.length > 40) {
    username = username.slice(0, 40)
    if (!fix) {
      throw new Error('Username is limited to 40 characters.')
    }
  }
  if (
    username === 'terms' ||
    username === 'privacy' ||
    username === 'settings'
  ) {
    if (!fix) {
      throw new Error(
        `Username cannot be \`${username}\` as it is reserved for internal usage.`,
      )
    }
    username = ''
  }

  return username
}

function decryptUser(row: ?UserSQL): ?UserSQL {
  if (!row) {
    return null
  }

  const nextUser = { ...row }

  if (nextUser.openAiKey) {
    nextUser.openAiKey = Security.decrypt(nextUser.openAiKey)
  }

  return nextUser
}
