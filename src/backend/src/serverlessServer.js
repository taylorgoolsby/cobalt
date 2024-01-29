// @flow

// $FlowFixMe
import serverless from 'serverless-http'
import app from './server.js'

export const handler: any = serverless(app)
