// @flow

import { unpackSessionToken } from './Token.js'

export default async function createViewer(
  sessionToken: ?string,
  ctx: any,
): any {
  if (sessionToken) {
    const viewer = await unpackSessionToken(sessionToken, ctx)
    return viewer
  } else {
    ctx.session = {}
    ctx.isAuthenticated = false
    return {}
  }
}
