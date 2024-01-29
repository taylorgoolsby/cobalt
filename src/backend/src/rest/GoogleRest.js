// @flow

import Config from 'common/src/Config.js'
import querystring from 'querystring'
import axios from 'axios'
import parseAxiosError from '../utils/parseAxiosError.js'

export type TokenResGoogle = {
  access_token: string,
  expires_in: number,
  id_token: string,
  scope: string,
  token_type: string,
  refresh_token: string,
}

export type UserResGoogle = {
  id: string,
  email: string,
  verified_email: boolean,
  name: string,
  given_name: string,
  family_name: string,
  picture: string,
  locale: string,
  hd: string,
}

type GoogleUserEmails = Array<{
  email: string,
  primary: boolean,
  verified: boolean,
  visibility: ?string,
}>

export default class GoogleRest {
  static genAuthUrl(state: string): string {
    const qs = querystring.stringify({
      access_type: 'offline',
      response_type: 'code',
      // prompt: "consent",
      client_id: Config.oauthGoogleClientId,
      redirect_uri: `${Config.backendHost}/oauth/google/end`,
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '),
      state,
    })
    return `https://accounts.google.com/o/oauth2/v2/auth?${qs}`
  }

  static async token(code: string): Promise<TokenResGoogle> {
    let data = await send('POST', 'https://oauth2.googleapis.com/token', {
      code,
      client_id: Config.oauthGoogleClientId,
      client_secret: Config.oauthGoogleSecret,
      redirect_uri: Config.oauthGoogleRedirectUrl,
      grant_type: 'authorization_code',
    })
    return data
  }

  static async getUser(
    accessToken: string,
    idToken: string,
  ): Promise<UserResGoogle> {
    // const userInfoRes = await send('GET', `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`, {}, idToken)
    const userInfoRes = await send(
      'GET',
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json`,
      {},
      accessToken,
    )
    return userInfoRes
  }

  static async getUserPrimaryVerifiedEmail(token: string): Promise<?string> {
    const userInfoRes: UserResGoogle = await send(
      'GET',
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json`,
      {},
      token,
    )
    if (!userInfoRes?.verified_email) return null
    return userInfoRes.email
  }
}

async function send(
  method: 'GET' | 'POST',
  url: string,
  data: ?{ [string]: any },
  authToken?: string,
): any {
  const config: { url: string, headers?: { ... }, ... } = {
    method: method.toLowerCase(),
    url,
  }

  if (authToken) {
    config.headers = {
      Authorization: `Bearer ${authToken}`,
    }
  }

  if (method === 'GET') {
    // $FlowFixMe
    config.params = data
  } else if (method === 'POST') {
    // $FlowFixMe
    config.data = data
  }

  const res = await axios(config)
    .then((response) => {
      return response.data
    })
    .catch((err) => {
      return parseAxiosError(err)
    })

  return res
}
