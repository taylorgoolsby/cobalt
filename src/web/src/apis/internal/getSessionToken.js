// @flow

import { post } from '../../utils/post.js'
import Config from '../../Config.js'

export type GetSessionTokenInput = {
  emailToken?: ?string,
  mfaToken?: ?string,
  passwordToken?: ?string,
  oauthToken?: ?string,
  ssoToken?: ?string,
  refreshToken?: ?string,
  newUserToken?: ?string,
  operatorToken?: ?string,
}

async function getSessionToken(input: GetSessionTokenInput): Promise<?string> {
  const res = await post(`${Config.backendHost}/getSessionToken`, input)
  return res
}

export default getSessionToken
