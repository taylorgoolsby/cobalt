// @flow

import type { SessionToken } from '../utils/Token.js'
import { Router } from 'express'
import InternalApi from './internal/InternalApi.js'
import ExposedApi from './exposed/ExposedApi.js'
import type { ApiHandler, ApiPayload } from './apiTypes.js'
import type { AgencySQL } from '../schema/Agency/AgencySchema.js'
import writeSSE from '../utils/writeSSE.js'

export default function setupRest(app: any): void {
  // The RestApi is used for API interaction with third parties we don't control.
  const apiRouter = new Router()
  app.use('/api', apiRouter)
  Object.keys(ExposedApi).forEach((endpoint) => {
    console.debug(`Setup Rest Endpoint: /api${endpoint}`)
    apiRouter[ExposedApi[endpoint].method](endpoint, async (req, res) => {
      console.debug(`Handling Rest Endpoint: /api${endpoint}`)

      if (!req.authData) {
        throw new Error('Unauthorized')
      }
      const agency: AgencySQL = req.authData
      const userId: string = req.authClientId

      res.on('close', () => {
        res.end()
        console.log(`closed connection for /api${endpoint}`)
      })

      try {
        const handler: ApiHandler<AgencySQL> = ExposedApi[endpoint].handler
        const result: ?ApiPayload = await handler(
          req,
          res,
          req.params,
          req.body,
          agency,
          userId,
        )
        if (result) {
          res.json(result)
        } else if (endpoint === '/chat/:agencyConversationId/sse') {
          // keep connection open for SSE
          console.log('keep open')
        } else {
          res.end()
        }
      } catch (err) {
        console.error(err)
        if (endpoint === '/chat/:agencyConversationId/sse') {
          // This is an SSE endpoint, which has special headers already set.
          await writeSSE(res, { error: err.message })
          res.end()
        } else {
          res.status(400).json({ error: err.message })
        }
      }

      console.debug(`Rest Endpoint Complete: /api${endpoint}`)
    })
  })

  // The interface is used for dashboard client-server interaction. We own the client.
  const internalServiceRouter = new Router()
  app.use('/service', internalServiceRouter)
  Object.keys(InternalApi).forEach((endpoint) => {
    console.debug(`Setup Rest Endpoint: /service${endpoint}`)
    internalServiceRouter[InternalApi[endpoint].method](
      endpoint,
      async (req, res) => {
        console.debug(`Handling Rest Endpoint: /service${endpoint}`)

        if (!req.authData) {
          throw new Error('Unauthorized')
        }
        const session: SessionToken = req.authData
        const userId: string = req.authClientId

        const args: { [string]: any } = {
          ...req.body,
          ...req.files,
        }

        res.on('close', () => {
          res.end()
          console.log('closed connection')
        })

        try {
          const handler: ApiHandler<SessionToken> =
            InternalApi[endpoint].handler
          const result: ?ApiPayload = await handler(
            req,
            res,
            req.params,
            args,
            session,
            userId,
          )
          if (result) {
            res.json(result)
          } else {
            res.end()
          }
        } catch (err) {
          console.error(err)
          if (endpoint === '/chat/:agencyId/sendMessage') {
            // This is an SSE endpoint, which has special headers already set.
            await writeSSE(res, { error: err.message })
            res.end()
          } else {
            res.status(400).json({ error: err.message })
          }
        }

        console.debug(`Rest Endpoint Complete: /service${endpoint}`)
      },
    )
  })
}
