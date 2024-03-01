// @flow

import {
  createSessionToken,
  OAuthProviders,
  unpackMfaToken,
  unpackNewUserToken,
  unpackOauthToken,
  unpackPasswordToken,
  unpackSessionToken,
} from '../../utils/Token.js'
import UserInterface from '../../schema/User/UserInterface.js'
import type {
  AuthToken,
  NewUserToken,
  OauthToken,
  PasswordToken,
  SessionToken,
} from '../../utils/Token.js'
import type { UserSQL } from '../../schema/User/UserSchema.js'
import Email from '../Email.js'

/*
The getSessionToken should always be the last function in the auth process,
and it is the only function which actually generates sessionToken.

It receives various kinds of tokens, which are all optional.
Each token verifies that the holder owns the account.
Some authentication flows requires multiple kinds of tokens to be present (MFA),
and some users cannot accept some kinds of tokens as verification.

All tokens except for the sessionToken should be signed using the authTokenSecret.
The sessionToken is signed using a different secret because it has a different exposure profile,
only being shared with the client, and it has a longer lifetime than the other tokens.
* */

function createOauthToken(userId: string) {}

export default async function getSessionToken(req: any, res: any) {
  try {
    const {
      emailToken,
      mfaToken,
      passwordToken,
      oauthToken,
      ssoToken,
      refreshToken,
      newUserToken,
      operatorToken,
    } = req.body

    res.set('Cache-Control', 'no-cache')

    const anyToken =
      emailToken ||
      mfaToken ||
      passwordToken ||
      oauthToken ||
      ssoToken ||
      refreshToken ||
      newUserToken ||
      operatorToken

    if (!anyToken) {
      // If no token is needed then this call is to issue an anonymous sessionToken.
      throw new Error('Anonymous sessions are not supported.')
    }

    // Use the user details to perform any detailed auth token checks.

    if (oauthToken) {
      const [payload, primaryUser, exactUser] =
        await unpackAndGetUser<OauthToken>(unpackOauthToken, oauthToken)

      if (
        payload.oauthProvider === OAuthProviders.GOOGLE &&
        !exactUser.oauthIdGoogle
      ) {
        throw new Error('Google OAuth is not supported for this user.')
      }
      if (
        payload.oauthProvider === OAuthProviders.GITHUB &&
        !exactUser.oauthIdGithub
      ) {
        throw new Error('Github OAuth is not supported for this user.')
      }
      const sessionToken = await createSessionToken(primaryUser.userId)
      res.send(sessionToken)
      return
    }

    if (newUserToken) {
      const [payload, primaryUser, exactUser] =
        await unpackAndGetUser<NewUserToken>(unpackNewUserToken, newUserToken)

      if (payload.email !== exactUser.email) {
        throw new Error('newUserToken was not issued for the correct email.')
      }

      await UserInterface.setTempFalse(exactUser.userId)
      await UserInterface.setEmailVerified(
        exactUser.userId,
        payload.email,
        true,
      )
      const sessionToken = await createSessionToken(primaryUser.userId)
      res.send(sessionToken)
      return
    }

    if (passwordToken) {
      const [payload, primaryUser, exactUser] =
        await unpackAndGetUser<PasswordToken>(
          unpackPasswordToken,
          passwordToken,
        )

      // Check if MFA is needed
      if (primaryUser.isMfaEnabled) {
        if (!mfaToken) {
          throw new Error('MFA is required for this user.')
        }
        const unpackedMfaToken = await unpackMfaToken(mfaToken)
        if (unpackedMfaToken.userId !== primaryUser.userId) {
          throw new Error('mfaToken was not issued to this user.')
        }
        const isPhoneMfa =
          !!primaryUser.phoneCallingCode || !!primaryUser.phoneNumber
        if (isPhoneMfa) {
          if (
            unpackedMfaToken.phoneCallingCode !==
              primaryUser.phoneCallingCode ||
            unpackedMfaToken.phoneNumber !== primaryUser.phoneNumber
          ) {
            throw new Error('Incorrect MFA channel.')
          }
        } else {
          throw new Error('Unsupported MFA method.')
        }
      }

      const sessionToken = await createSessionToken(primaryUser.userId)
      res.send(sessionToken)
      return
    }

    if (refreshToken) {
      const [payload, primaryUser, exactUser] =
        await unpackAndGetUser<SessionToken>(unpackSessionToken, refreshToken)

      const sessionToken = await createSessionToken(primaryUser.userId)
      res.send(sessionToken)
      return
    }

    throw new Error('Unsupported Auth Token')
  } catch (err) {
    console.error(err)
    res.status(400).send(err.message)
  }
}

async function unpackAndGetUser<T: AuthToken>(
  unpackingFunction: (string) => Promise<T>,
  token: string,
): Promise<[T, UserSQL, UserSQL]> {
  const payload = await unpackingFunction(token)
  const userId = payload.userId
  if (!userId) {
    throw new Error('The token does not contain a userId')
  }
  const exactUser = await UserInterface.getUser(userId)
  if (!exactUser) {
    throw new Error(
      'The user associated with the token does not exist anymore.',
    )
  }
  const allUsers = await UserInterface.getMultiAccounts(exactUser.userId)
  const primaryUser = allUsers[0]
  if (!primaryUser) {
    throw new Error('Unable to find a primary account.')
  }

  return [payload, primaryUser, exactUser]
}
