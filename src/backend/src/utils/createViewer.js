// @flow

import { unpackSession } from './Token.js'

export default async function createViewer(
  sessionToken: ?string,
  ctx: any,
): any {
  if (sessionToken) {
    const viewer = await unpackSession(sessionToken, ctx)
    return viewer
  } else {
    ctx.session = {}
    ctx.isAuthenticated = false
    return {}
  }
}
