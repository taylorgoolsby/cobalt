// @flow

import GithubRest from '../rest/GithubRest.js'
import GoogleRest from '../rest/GoogleRest.js'
import ID from './ID.js'
import User from '../schema/User/UserInterface.js'

const states: {
  [state: string]: {
    finalPath: string,
  },
} = {}

function setState(state: string, finalPath: string) {
  states[state] = {
    finalPath,
  }
  setTimeout(() => {
    delete states[state]
  }, 1000 * 60 * 5)
}

export default class OAuth {
  static startGithub(finalPath: string): { state: string, url: string } {
    if (!finalPath || !finalPath.startsWith('/')) {
      throw new Error('final_path must start with /')
    }

    const state = ID.getRandom()
    setState(state, finalPath)
    const url = GithubRest.genAuthUrl(state)
    console.log('url', url)
    return {
      state,
      url,
    }
  }

  static async endGithub(
    cookieState: string,
    queryState: string,
    code: string,
  ): Promise<{
    userId: string,
    finalPath: string,
  }> {
    if (cookieState !== queryState) {
      throw new Error('The cookie state is invalid.')
    }
    const memoryState = states[queryState]
    if (!memoryState) {
      throw new Error('OAuth is expired.')
    }
    const tokenRes = await GithubRest.token(code)
    const userRes = await GithubRest.getUser(tokenRes.access_token)
    const userEmail = await GithubRest.getUserPrimaryVerifiedEmail(
      tokenRes.access_token,
    )
    if (!userEmail) {
      throw new Error(
        'We were unable to find the verified primary email address on your Github account.',
      )
    }
    const userId = await User.insertFromOauthGithub(
      tokenRes,
      userRes,
      userEmail,
    )
    return {
      userId,
      finalPath: memoryState.finalPath,
    }
  }

  static startGoogle(finalPath: string): { state: string, url: string } {
    if (!finalPath || !finalPath.startsWith('/')) {
      throw new Error('final_path must start with /')
    }

    const state = ID.getRandom()
    setState(state, finalPath)
    const url = GoogleRest.genAuthUrl(state)
    return {
      state,
      url,
    }
  }

  static async endGoogle(
    cookieState: string,
    queryState: string,
    code: string,
  ): Promise<{
    userId: string,
    finalPath: string,
  }> {
    if (cookieState !== queryState) {
      throw new Error('The cookie state is invalid.')
    }
    const memoryState = states[queryState]
    if (!memoryState) {
      throw new Error('OAuth is expired.')
    }
    const tokenRes = await GoogleRest.token(code)
    const userRes = await GoogleRest.getUser(
      tokenRes.access_token,
      tokenRes.id_token,
    )
    const userEmail = await GoogleRest.getUserPrimaryVerifiedEmail(
      tokenRes.access_token,
    )
    if (!userEmail) {
      throw new Error(
        'We were unable to find the verified primary email address on your Github account.',
      )
    }
    const userId = await User.insertFromOauthGoogle(
      tokenRes,
      userRes,
      userEmail,
    )
    return {
      userId,
      finalPath: memoryState.finalPath,
    }
  }
}
