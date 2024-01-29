// @flow

import Config from 'common/src/Config.js'
import querystring from 'querystring'
import axios from 'axios'
import parseAxiosError from '../utils/parseAxiosError.js'

export type TokenResGithub = {
  access_token: string,
  // expires_in: string,
  // id_token: string,
  scope: string,
  token_type: string,
  // refresh_token: string,
}

export type UserResGithub = {
  login: string,
  id: number,
  node_id: string,
  avatar_url: string,
  gravatar_id: string,
  url: string,
  html_url: string,
  followers_url: string,
  following_url: string,
  gists_url: string,
  starred_url: string,
  subscriptions_url: string,
  organizations_url: string,
  repos_url: string,
  events_url: string,
  received_events_url: string,
  type: string,
  site_admin: boolean,
  name: string,
  company: string,
  blog: string,
  location: string,
  email: string,
  hireable: boolean,
  bio: string,
  twitter_username: string,
  public_repos: number,
  public_gists: number,
  followers: number,
  following: number,
  created_at: string,
  updated_at: string,
}

type GithubUserEmails = Array<{
  email: string,
  primary: boolean,
  verified: boolean,
  visibility: ?string,
}>

export default class GithubRest {
  static genAuthUrl(state: string): string {
    const qs = querystring.stringify({
      client_id: Config.oauthGithubClientId,
      redirect_uri: `${Config.backendHost}/oauth/github/end`,
      scope: 'user:email',
      state,
    })
    return `https://github.com/login/oauth/authorize?${qs}`
  }

  static async token(code: string): Promise<TokenResGithub> {
    let data = await send(
      'POST',
      'https://github.com/login/oauth/access_token',
      {
        code,
        client_id: Config.oauthGithubClientId,
        client_secret: Config.oauthGithubSecret,
        redirect_uri: Config.oauthGithubRedirectUrl,
        grant_type: 'authorization_code',
      },
    )
    data = querystring.parse(data)
    return data
  }

  static async getUser(token: string): Promise<UserResGithub> {
    return await send('GET', `https://api.github.com/user`, {}, token)
  }

  static async getUserPrimaryVerifiedEmail(token: string): Promise<?string> {
    const userEmails: GithubUserEmails = await send(
      'GET',
      `https://api.github.com/user/emails`,
      {},
      token,
    )
    const primaryVerifiedEmail = userEmails.find(
      (entry) => entry.primary && entry.verified,
    )
    return primaryVerifiedEmail?.email
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
      'X-GitHub-Api-Version': '2022-11-28',
      Accept: 'application/vnd.github+json',
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
