// @flow

import { loadEnv } from './loadEnv.js'
const env = loadEnv()
import nonMaybe from 'non-maybe'
import credentials from './loadAwsCredentials.js'
import { raw } from '../sql-template-tag.js'
import fs from 'fs'
import path from 'path'
import hash from 'short-hash'

import { fileURLToPath } from 'url'
// $FlowFixMe
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
console.log('__dirname', __dirname)

const {
  NODE_ENV,
  STAGE,
  DB_PREFIX,
  // RUNTIME_ENV,
  // IS_OFFLINE, // set by serverless-offline
  AUTH_TOKEN_SECRET,
  SESSION_TOKEN_SECRET,
  CIPHER_KEY,
  API_HOST,
  WEB_BACKEND_HOST,
  WEB_CLIENT_HOST,
  OPENAI_PUBLIC_TRIAL_KEY,
  OAUTH_GITHUB_CLIENT_ID,
  OAUTH_GITHUB_SECRET,
  OAUTH_GOOGLE_CLIENT_ID,
  OAUTH_GOOGLE_SECRET,
  POSTMARK_DOMAIN,
  POSTMARK_SEND_KEY,
  MAILGUN_DOMAIN,
  MAILGUN_SEND_KEY,
  EMAIL_FROM_ADDRESS,
  ADMIN_EMAIL,
  TWILIO_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER,
  AWS_REGION,
  AWS_RESOURCE_BASE_NAME,
  DB_HOST,
  DB_DATABASE,
  DB_USER,
  DB_PASSWORD,
  PORT,
} = process.env

console.log('NODE_ENV', NODE_ENV)

const isLocal = !NODE_ENV || NODE_ENV === 'local' || NODE_ENV === 'development' // npm start should have NODE_ENV undefined.
const isStaging = NODE_ENV === 'staging' // When deploying, but not prod, should set NODE_ENV=staging.
const isProd = NODE_ENV === 'production' // When deploying as prod, should set NODE_ENV=production.
const useLocalCan = process.env.USE_LOCALCAN === 'true'

console.log('isLocal', isLocal)
console.log('isStaging', isStaging)
console.log('isProd', isProd)

if (isLocal && !credentials.accessKeyId) {
  throw new Error(
    'When running locally, you should have aws_access_key_id defined in your ~/.aws/credentials file.',
  )
}

const stage = !STAGE ? hash(credentials.accessKeyId) : nonMaybe(STAGE)
const dbPrefix = nonMaybe(DB_PREFIX)

console.log('stage', stage)
console.log('dbPrefix', dbPrefix)

const packageRaw = fs.readFileSync(
  path.resolve(process.cwd(), 'package.json'),
  { encoding: 'utf-8' },
)
const pkg = JSON.parse(packageRaw)
const version = pkg.version
console.log('version', version)

const port = parseInt(PORT) || 4000
// const backendHost = WEB_BACKEND_HOST ? WEB_BACKEND_HOST : `http://localhost:${port}`
const backendHost = isLocal
  ? `http://localhost:${port}`
  : nonMaybe(WEB_BACKEND_HOST)

const dbDatabase = isLocal ? 'local_cobalt' : nonMaybe(DB_DATABASE)
console.log('dbDatabase', dbDatabase)

const oauthGithubClientId = OAUTH_GITHUB_CLIENT_ID
const oauthGithubSecret = OAUTH_GITHUB_SECRET

const oauthGoogleClientId = OAUTH_GOOGLE_CLIENT_ID
const oauthGoogleSecret = OAUTH_GOOGLE_SECRET

const awsConfig: {
  region: string,
  credentials: {
    accessKeyId: string,
    secretAccessKey: string,
  },
} = {
  region: nonMaybe(AWS_REGION),
  credentials,
}

const cdkEnvironment = env
delete cdkEnvironment['AWS_REGION']
delete cdkEnvironment['AWS_PROFILE']

const awsResourceBaseName: string = nonMaybe(AWS_RESOURCE_BASE_NAME)

class Config {
  static appName: string = 'cobalt'
  static cdkEnvironment: { [string]: any } = cdkEnvironment
  static version: string = nonMaybe(version)
  static stage: string = stage
  static dbPrefix: any = raw(dbPrefix)
  static env: string = nonMaybe(DB_PREFIX)
  static isProd: boolean = isProd

  static dbPort: number = 3306
  static dbHost: string = isLocal ? '127.0.0.1' : nonMaybe(DB_HOST)
  static dbUser: string = isLocal ? 'root' : nonMaybe(DB_USER)
  static dbPassword: string = isLocal ? '' : nonMaybe(DB_PASSWORD)
  static dbDatabase: string = dbDatabase
  // static oauthGoogleId: string = nonMaybe(OAUTH_GOOGLE_ID)
  // static oauthGoogleSecret: string = nonMaybe(OAUTH_GOOGLE_SECRET)

  static openAiPublicTrialKey: string = nonMaybe(OPENAI_PUBLIC_TRIAL_KEY)

  static oauthGithubClientId: ?string = oauthGithubClientId
  static oauthGithubSecret: ?string = oauthGithubSecret
  static oauthGithubRedirectUrl: string = `${backendHost}/oauth/github/end`
  static oauthGoogleClientId: ?string = oauthGoogleClientId
  static oauthGoogleSecret: ?string = oauthGoogleSecret
  static oauthGoogleRedirectUrl: string = `${backendHost}/oauth/google/end`

  static postmarkDomain: string = nonMaybe(POSTMARK_DOMAIN)
  static postmarkKey: string = nonMaybe(POSTMARK_SEND_KEY)
  static mailgunDomain: string = nonMaybe(MAILGUN_DOMAIN)
  static mailgunKey: string = nonMaybe(MAILGUN_SEND_KEY)
  static emailFromAddress: string = nonMaybe(EMAIL_FROM_ADDRESS)
  static adminEmail: string = nonMaybe(ADMIN_EMAIL)

  static twilioSid: string = nonMaybe(TWILIO_SID)
  static twilioAuthToken: string = nonMaybe(TWILIO_AUTH_TOKEN)
  static twilioFromNumber: string = nonMaybe(TWILIO_FROM_NUMBER)

  static port: number = port
  // static webHost: string = 'http://localhost:63465'
  // static backendHost: string = 'http://localhost:63453'
  static webHost: string = 'http://localhost:3000'
  static backendHost: string = 'http://localhost:4000'

  static authTokenSecret: string = nonMaybe(AUTH_TOKEN_SECRET)
  static sessionTokenSecret: string = nonMaybe(SESSION_TOKEN_SECRET)
  static cipherKey: string = nonMaybe(CIPHER_KEY)

  static awsConfig: typeof awsConfig = awsConfig
  static awsResourceBaseName: string = awsResourceBaseName
  static awsUploadBucketName: string = `${awsResourceBaseName}-upload-${stage}`
}

export default Config
