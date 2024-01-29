// @flow

import { parse } from 'regexparam'

type AuthResult = {
  authData: { [string]: any },
  authClientId: string,
}

type AuthHandler = (req: any, authHeader: ?string) => Promise<AuthResult>

type AuthHandlerConfig = {
  [route: string]: AuthHandler,
}

/*

  This will attach req.authData and req.authClientId.

  handleAuthentication should be one of the first middleware to run.

  Example Usage:

    handleAuthentication(app, {
      '/api/*': async (authHeader) => {
        if (!authHeader) {
          throw new Error('Unauthorized')
        }

        const authCode = authHeader.match(/^Basic (.*)/)?.[1]
        if (!authCode) {
          throw new Error('Unauthorized')
        }

        const project = await ProjectInterface.getActiveByAuthCode(authCode)
        if (!project) {
          throw new Error('Unauthorized')
        }

        return {
          authData: project,
          authClientId: project.userId
        }
      },
      '/service/*': async (authHeader) => {
        if (!authHeader) {
          throw new Error('Unauthorized')
        }

        const sessionToken = authHeader.match(/^Basic (.*)/)?.[1]
        if (!sessionToken) {
          throw new Error('Unauthorized')
        }

        const session = await createSession(sessionToken)
        if (!session) {
          throw new Error('Unauthorized')
        }

        return {
          authData: session,
          authClientId: session.userId
        }
      }
    })

* */
function handleAuthentication(app: any, handlers: AuthHandlerConfig) {
  const parsers: Array<{
    parser: any,
    handler: AuthHandler,
  }> = []

  for (const route of Object.keys(handlers)) {
    parsers.push({
      parser: parse(route),
      handler: handlers[route],
    })
  }

  app.use(async function (req, res, next) {
    const handler: ?AuthHandler = parsers.find(({ parser }) =>
      parser.pattern.test(req.path),
    )?.handler

    if (handler) {
      const authHeader = req.get('Authorization')
      try {
        const result: AuthResult = await handler(req, authHeader)
        req.authData = result.authData
        req.authClientId = result.authClientId
      } catch (err) {
        console.error(err)
        res.status(401).json({ error: err.message })
        return // Do not call next()
      }
    }

    next()
  })
}

export default handleAuthentication
