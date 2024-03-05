// @flow

/*
 * I apologize for the mess.
 * */

import type { AgencySQL } from './schema/Agency/AgencySchema.js'
import connectDataTransferLog from './rest/connectDataTransferLog.js'
import './utils/Logmix.js'

// import getMetadata from "./utils/getMetadata.js"
// import fs from "fs"
import path from 'path'
import { fileURLToPath } from 'url'
// $FlowFixMe
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import express from 'express'
import Cookies from 'cookies'
import fileUpload from 'express-fileupload'
import OAuth from './utils/OAuth.js'
import Config from 'common/src/Config.js'
import {
  unpackSessionToken,
  createOauthToken,
  OAuthProviders,
  unpackDemoSessionToken,
} from './utils/Token.js'
import './mysql/runMigration.js'
import setupRest from './rest/setupRest.js'
import { createHandler } from 'graphql-http/lib/use/express'
import { schema } from './schema/schema.js'
import cors from 'cors'
import handleAuthentication from './rest/handleAuthentication.js'
import getSessionToken from './rest/internal/getSessionToken.js'
import querystring from 'querystring'
import AuthTokenInterface from './schema/AuthToken/AuthTokenInterface.js'
import AgencyInterface from './schema/Agency/AgencyInterface.js'
import Bugsnag from '@bugsnag/js'
import BugsnagPluginExpress from '@bugsnag/plugin-express'
import setupWebsockets from './websocket/setupWebsockets.js'
import fs from 'fs'
import { redactedFields } from './utils/redact.js'

const keys = ['9T9fNOr8o04PfTBRfZM/qMFPjMDmg3gdKmkwCpvKd1E=']

Bugsnag.start({
  // This key can be public:
  apiKey: '135961c700e05de1db1294359a2f4af6',
  plugins: [BugsnagPluginExpress],
  appVersion: '1',
  releaseStage: process.env.NODE_ENV,
  enabledReleaseStages: ['production', 'staging'],
  autoTrackSessions: false,
  redactedKeys: redactedFields,
})

const bugsnagMiddleware = Bugsnag.getPlugin('express')

const app: any = express()

app.use(bugsnagMiddleware.requestHandler)

// todo: restrict cors to our domains:
app.use(cors())
app.use(express.json())
app.use(fileUpload())

app.use(function (req, res, next) {
  const timestamp = Date.now()
  req.timestamp = timestamp
  next()
})

// Append `req.clientIp`.
app.use(function (req, res, next) {
  try {
    const xForwardedFor = req.get('x-forwarded-for')?.split(', ') ?? []
    // If spoofed:
    // [0] is the spoofed ip
    // [1] is the client ip
    // [2:n-2] are intermediate proxies
    // [n-1] is the cloudfront proxy.

    // If not spoofed:
    // [0] is the client ip
    // [1:n-2] are intermediate proxies
    // [n-1] is the cloudfront proxy.

    // If spoofed, there's at least 3.
    // If not, there's at least 2.

    const spoofOrClient = xForwardedFor[0] ?? '127.0.0.1'
    const clientOrProxy = xForwardedFor[1] ?? spoofOrClient

    if (xForwardedFor.length === 2) {
      req.clientIp = spoofOrClient
    } else {
      req.clientIp = clientOrProxy
    }

    if (!req.clientIp) {
      res.status(400).json({ error: 'IP address unresolved.' })
    } else {
      next()
    }
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: 'IP address unresolved.' })
  }
})

// Insert Authentication header middleware here.
// This attaches a req.authData object
// which can be used by subsequent middleware or API handlers.
handleAuthentication(app, {
  '/api/*': async (req, authHeader) => {
    if (!authHeader) {
      throw new Error('Unauthorized')
    }

    const sessionToken = authHeader.match(/^Demo (.*)/)?.[1]
    const authToken = authHeader.match(/^Bearer (.*)/)?.[1]

    if (!authToken && !sessionToken) {
      throw new Error('Unauthorized')
    }

    let agency: ?AgencySQL
    let userId: ?string
    if (sessionToken) {
      const viewer = await unpackDemoSessionToken(sessionToken)
      if (viewer?.userId && viewer?.demoAgencyId) {
        userId = viewer.userId
        agency = await AgencyInterface.getOwned(
          viewer.demoAgencyId,
          viewer.userId,
        )
      }
    } else if (authToken) {
      const { agencyId } = req.params
      const authKey = await AuthTokenInterface.getByToken(authToken)
      if (!authKey) {
        throw new Error('Unauthorized')
      }
      const agencyVersions = await AgencyInterface.getActiveVersions(
        authKey.agencyVersionId,
      )
      // This verifies the agency version associated with the auth token contains the agency id.
      agency = agencyVersions.find((agency) => agency.agencyId === agencyId)
      userId = agency?.userId
      // todo: Organizations
      //  Right now, a single user is mapped to a single agency,
      //  so user.openAiKey is assignable to a single user and single agency.
      //  When organizations are implemented,
      //  There may be organization-level openai keys,
      //  but multiple users.
      //  Only admins can configure the openai key for an organization.
      //  Currently, the userId is used to get the openai key and verify
      //  ownership of objects.
      //  This will need to be changed by still passing the caller's userId,
      //  but the openai key is retrieved from the organization level.
      //  Ownership can still be done from userId.
      //  cobalt keys are then assigned to users in order to get a
      //  userId from the key.
      //  This is similar to how in AWS, a bot user is created with
      //  programmatic access credentials.
    }

    if (!agency) {
      throw new Error('Unauthorized')
    }

    if (!userId) {
      throw new Error('Unauthorized')
    }

    return {
      authData: agency,
      authClientId: userId,
    }
  },
  '/service/*': async (req, authHeader) => {
    if (!authHeader) {
      throw new Error('Unauthorized')
    }

    const sessionToken = authHeader.match(/^Basic (.*)/)?.[1]
    if (!sessionToken) {
      throw new Error('Unauthorized')
    }

    const session = await unpackSessionToken(sessionToken, {})
    if (!session) {
      throw new Error('Unauthorized')
    }

    return {
      authData: session,
      authClientId: session.userId,
    }
  },
})
connectDataTransferLog(app)
setupRest(app)
const server: any = setupWebsockets(app)

app.get('/health', (req, res) => {
  res.send('OK')
})

/**********************************
 *********** OAUTH START **********
 **********************************/

app.get('/oauth/github/start', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-cache')

    const { final_path } = req.query

    const { state, url } = OAuth.startGithub(final_path)
    const cookies = new Cookies(req, res, { keys, secure: true })
    cookies.set('state', state, {
      signed: true,
      maxAge: 60 * 5 * 1000,
      secure: Config.backendHost.startsWith('https') ? true : false,
      sameSite: 'lax',
    })

    res.redirect(301, url)
  } catch (err) {
    console.error(err)
    res.status(400).send(err.message)
  }
})

app.get('/oauth/github/end', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-cache')

    const { code, state } = req.query
    const cookies = new Cookies(req, res, { keys, secure: true })
    const cookieState = cookies.get('state', { signed: true })

    const { userId, finalPath } = await OAuth.endGithub(
      cookieState,
      state,
      code,
    )
    const oauthToken = await createOauthToken(userId, OAuthProviders.GITHUB)

    const finalPathArgsIndex = finalPath.indexOf('?')
    const finalPathArgString =
      finalPathArgsIndex !== -1 ? finalPath.slice(finalPathArgsIndex + 1) : ''
    const finalPathArgs = querystring.parse(finalPathArgString)
    const finalPathRoute =
      finalPathArgsIndex !== -1
        ? finalPath.slice(0, finalPathArgsIndex)
        : finalPath
    const finalArgs = querystring.stringify({
      ...finalPathArgs,
      oauthToken,
    })

    res.redirect(301, `${Config.webHost}${finalPathRoute}?${finalArgs}`)
  } catch (err) {
    console.error(err)
    res.status(400).send(err.message)
  }
})

app.get('/oauth/google/start', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-cache')

    const { final_path } = req.query

    const { state, url } = OAuth.startGoogle(final_path)
    const cookies = new Cookies(req, res, { keys, secure: true })
    cookies.set('state', state, {
      signed: true,
      maxAge: 60 * 5 * 1000,
      secure: Config.backendHost.startsWith('https') ? true : false,
      sameSite: 'lax',
    })

    res.redirect(301, url)
  } catch (err) {
    console.error(err)
    res.status(400).send(err.message)
  }
})

app.get('/oauth/google/end', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-cache')

    const { code, state } = req.query
    const cookies = new Cookies(req, res, { keys, secure: true })
    const cookieState = cookies.get('state', { signed: true })

    const { userId, finalPath } = await OAuth.endGoogle(
      cookieState,
      state,
      code,
    )
    const oauthToken = await createOauthToken(userId, OAuthProviders.GOOGLE)

    const finalPathArgsIndex = finalPath.indexOf('?')
    const finalPathArgString =
      finalPathArgsIndex !== -1 ? finalPath.slice(finalPathArgsIndex + 1) : ''
    const finalPathArgs = querystring.parse(finalPathArgString)
    const finalPathRoute =
      finalPathArgsIndex !== -1
        ? finalPath.slice(0, finalPathArgsIndex)
        : finalPath
    const finalArgs = querystring.stringify({
      ...finalPathArgs,
      oauthToken,
    })

    res.redirect(301, `${Config.webHost}${finalPathRoute}?${finalArgs}`)
  } catch (err) {
    console.error(err)
    res.status(400).send(err.message)
  }
})

// Todo: This should use CORS
app.post('/getSessionToken', getSessionToken)

/**********************************
 *********** OAUTH END ************
 **********************************/

app.use(
  '/graphql',
  createHandler({
    schema,
    context: (req) => ({}),
  }),
)

/**********************************
 *********** WEB START ************
 **********************************/

// function checkExtension(filepath: string) {
//   const allowed = [".js", ".mjs", ".cjs", ".js.map", ".html"]
//   const hit = allowed.find((ending) => filepath.endsWith(ending))
//   if (!hit) {
//     throw new Error("Has unsupported extension: " + filepath)
//   }
// }
//
// app.get("/common/src/serverMetadata.js", async (req, res) => {
//   const metadata = await getMetadata(req)
//   const js = `export default ${JSON.stringify(metadata)}`
//   res.setHeader("content-type", "application/javascript")
//   res.setHeader("x-content-type-options", "nosniff")
//   res.send(js)
// })
//
// app.get(/^\/common\/(.*)\/?$/i, async (req, res) => {
//   const filepath = req.params["0"]
//   try {
//     checkExtension(filepath)
//   } catch (err) {
//     res.status(404).send(err.message)
//     return
//   }
//   const finalFilePath = path.resolve(__dirname, `../../common/${filepath}`)
//   let js = fs.readFileSync(finalFilePath, { encoding: "utf-8" })
//   res.setHeader("content-type", "application/javascript")
//   res.setHeader("x-content-type-options", "nosniff")
//   res.send(js)
// })
//
// app.get(/^\/web\/(.*)\/?$/i, async (req, res) => {
//   const filepath = req.params["0"]
//   try {
//     checkExtension(filepath)
//   } catch (err) {
//     res.status(404).send(err.message)
//     return
//   }
//   const finalFilePath = path.resolve(__dirname, `../../web/${filepath}`)
//   let js = fs.readFileSync(finalFilePath, { encoding: "utf-8" })
//   res.setHeader("content-type", "application/javascript")
//   res.setHeader("x-content-type-options", "nosniff")
//   res.send(js)
// })
//
// app.get(/^\/node_modules\/(.*)\/?$/i, async (req, res) => {
//   const filepath = req.params["0"]
//   try {
//     checkExtension(filepath)
//   } catch (err) {
//     res.status(404).send(err.message)
//     return
//   }
//   const finalFilePath = path.resolve(
//     __dirname,
//     `../../web/node_modules/${filepath}`,
//   )
//   let js = fs.readFileSync(finalFilePath, { encoding: "utf-8" })
//   res.setHeader("content-type", "application/javascript")
//   res.setHeader("x-content-type-options", "nosniff")
//   res.send(js)
// })
//
// app.get("/*", async (req, res) => {
//   const html = fs.readFileSync(
//     path.resolve(__dirname, "../../web/src/index.html"),
//     {
//       encoding: "utf-8",
//     },
//   )
//   res.send(html)
// })

// Redirect http to https if not on localhost.
app.use((req, res, next) => {
  if (req.method === 'GET' && req.header('x-forwarded-proto') === 'http') {
    console.log('redirect')
    res.redirect(`https://${req.header('host')}${req.url}`)
  } else {
    next()
  }
})

const webPath =
  process.env.NODE_ENV === 'production' ? './dist' : '../../web/dist'
// app.get('/bundle.js', (req, res) => {
//   const js = fs.readFileSync(path.resolve(__dirname, webPath, './bundle.js'), {
//     encoding: 'utf-8',
//   })
//   res.setHeader('content-type', 'application/javascript')
//   res.setHeader('x-content-type-options', 'nosniff')
//   res.send(js)
// })
//
// app.get('/bundle.js.map', (req, res) => {
//   const js = fs.readFileSync(
//     path.resolve(__dirname, webPath, './bundle.js.map'),
//     {
//       encoding: 'utf-8',
//     },
//   )
//   res.setHeader('content-type', 'application/json')
//   res.setHeader('x-content-type-options', 'nosniff')
//   res.send(js)
// })

app.use(express.static(path.resolve(__dirname, webPath)))

app.get('/*', (req, res) => {
  const completedPath = path.resolve(
    __dirname,
    webPath,
    '.' + req.path + '.html',
  )

  let usedPath = completedPath
  if (!fs.existsSync(completedPath)) {
    if (req.path.startsWith('/app')) {
      usedPath = path.resolve(__dirname, webPath, 'app.html')
    } else {
      usedPath = path.resolve(__dirname, webPath, 'index.html')
    }
  }

  const indexHtml = fs.readFileSync(usedPath, {
    encoding: 'utf-8',
  })
  res.send(indexHtml)
})

/**********************************
 *********** WEB END **************
 **********************************/

app.use((req, res, next) => {
  return res.status(404).json({
    error: 'Not Found',
  })
})

app.use(bugsnagMiddleware.errorHandler)

export default server
