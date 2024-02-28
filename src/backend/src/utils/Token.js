// @flow

import * as jose from 'jose'
import Config from 'common/src/Config.js'
import InferenceRest from '../rest/InferenceRest.js'
import UserInterface from '../schema/User/UserInterface.js'

export const OAuthProviders = {
  GOOGLE: 'GOOGLE',
  GITHUB: 'GITHUB',
}
type OAuthProvider = $Keys<typeof OAuthProviders>

export type AuthToken = {
  userId: string,
}

export type SessionToken = AuthToken
export type DemoSessionToken = AuthToken & {
  demoAgencyId: number,
}
export type OauthToken = AuthToken & {
  oauthProvider: OAuthProvider,
}
export type NewUserToken = AuthToken & {
  email: string,
}
export type PasswordToken = AuthToken & {
  email: string,
}

export type MfaToken = AuthToken & {
  email?: ?string,
  phoneCallingCode?: ?string,
  phoneNumber?: ?string,
  type: '6-digit',
}

async function createToken(
  payload: { [string]: any },
  secret: string,
  salt: string,
  options?: {
    audience?: string,
    expirationTime?: string,
  },
): Promise<string> {
  const secretBytes = Buffer.from(secret, 'base64')
  const saltBytes = Buffer.from(salt, 'utf-8')
  const bytes = Buffer.concat([secretBytes, saltBytes])
  const alg = 'HS256'
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setIssuer(Config.backendHost)
    .setAudience(options?.audience ?? Config.webHost)
    .setExpirationTime(options?.expirationTime ?? '24h')
    .sign(bytes)
  return token
}

export async function unpackToken(
  token: string,
  secret: string,
  salt: string,
): Promise<{ [string]: any }> {
  const secretBytes = Buffer.from(secret, 'base64')
  const saltBytes = Buffer.from(salt, 'utf-8')
  const bytes = Buffer.concat([secretBytes, saltBytes])
  const alg = 'HS256'
  const res = await jose.jwtVerify(token, bytes, {
    algorithms: [alg],
    issuer: Config.backendHost,
  })
  return res.payload
}

// A mfaToken is a short lived token issued after an MFA code has been verified.
// This could be used to verify email, phone, or authenticator app.
export async function createMfaToken(data: {
  userId: string,
  email?: ?string,
  phoneCallingCode?: ?string,
  phoneNumber?: ?string,
}): Promise<string> {
  return await createToken(
    {
      ...data,
      type: '6-digit',
    },
    Config.authTokenSecret,
    'mfa',
  )
}

export async function unpackMfaToken(mfaToken: string): Promise<MfaToken> {
  const token: any = await unpackToken(mfaToken, Config.authTokenSecret, 'mfa')
  return token
}

// A newUserToken is a short lived token issued after account creation.
// If someone holds a valid newUserToken, they own the account associated with the userId.
export async function createPasswordToken(
  userId: string,
  email: string,
): Promise<string> {
  return await createToken(
    { userId, email },
    Config.authTokenSecret,
    'password',
  )
}

export async function unpackPasswordToken(
  passwordToken: string,
): Promise<PasswordToken> {
  const token: any = await unpackToken(
    passwordToken,
    Config.authTokenSecret,
    'password',
  )
  return token
}

// A newUserToken is a short lived token issued after account creation.
// If someone holds a valid newUserToken, they own the account associated with the userId.
export async function createNewUserToken(
  userId: string,
  email: string,
): Promise<string> {
  return await createToken({ userId, email }, Config.authTokenSecret, 'newUser')
}

export async function unpackNewUserToken(
  newUserToken: string,
): Promise<NewUserToken> {
  try {
    const token: any = await unpackToken(
      newUserToken,
      Config.authTokenSecret,
      'newUser',
    )
    return token
  } catch (err) {
    console.error(err)
    if (err.toString().startsWith('JWTExpired:')) {
      throw new Error('The link has expired. Please restart account creation.')
    } else {
      throw err
    }
  }
}

// An oauthToken is a short lived token issued at the end of oauth.
// If someone holds a valid oauthToken, they own the account associated with the userId.
export async function createOauthToken(
  userId: string,
  oauthProvider: OAuthProvider,
): Promise<string> {
  return await createToken(
    { userId, oauthProvider },
    Config.authTokenSecret,
    'oauthToken',
  )
}

export async function unpackOauthToken(
  oauthToken: string,
): Promise<OauthToken> {
  const token: any = await unpackToken(
    oauthToken,
    Config.authTokenSecret,
    'oauthToken',
  )
  return token
}

export async function createSessionToken(userId: string): Promise<string> {
  const token = await createToken({ userId }, Config.sessionTokenSecret, '', {
    expirationTime: '24h',
  })
  return token
}

export async function unpackSession(
  sessionToken: string,
  ctx: any,
): Promise<SessionToken> {
  const session: any = await unpackToken(
    sessionToken,
    Config.sessionTokenSecret,
    '',
  )

  if (!ctx.session) {
    ctx.session = session
    ctx.isAuthenticated = true
  }

  return session
}

// Like a sessionToken, but is used for accessing the API for demonstration purposes.
// It is short lived, and allows access to only a single agency.
export async function createDemoSessionToken(
  userId: string,
  agencyId: number,
): Promise<string> {
  return await createToken(
    { userId, demoAgencyId: agencyId },
    Config.authTokenSecret,
    'demoSessionToken',
    {
      expirationTime: '8h',
    },
  )
}

export async function unpackDemoSessionToken(
  demoSessionToken: string,
): Promise<DemoSessionToken> {
  const token: any = await unpackToken(
    demoSessionToken,
    Config.authTokenSecret,
    'demoSessionToken',
  )
  return token
}
