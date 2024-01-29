import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import dotenv from 'dotenv-defaults'

export function loadEnv() {
  const NODE_ENV = process.env.NODE_ENV

  const secretsPath = path.resolve(__dirname, '../secrets')

  let envObj = env('.defaults', secretsPath)
  envObj = {
    ...envObj,
    ...env('', secretsPath),
  }
  if (!NODE_ENV || NODE_ENV === 'local') {
    envObj = {
      ...envObj,
      ...env('.local', secretsPath),
    }
  } else if (NODE_ENV === 'development') {
    envObj = {
      ...envObj,
      ...env('.development', secretsPath),
    }
  } else if (NODE_ENV === 'staging') {
    envObj = {
      ...envObj,
      ...env('.staging', secretsPath),
    }
  } else if (NODE_ENV === 'production') {
    envObj = {
      ...envObj,
      ...env('.production', secretsPath),
    }
  }
  return envObj
}

function env(ending, secretsPath) {
  const filePath = path.resolve(secretsPath, `.env${ending}`)
  const exists = fs.existsSync(filePath)
  if (!exists) return {}
  const envFileContents = fs.readFileSync(filePath, { encoding: 'utf-8' })
  const envObj = dotenv.parse(envFileContents)
  for (const key of Object.keys(envObj)) {
    process.env[key] = envObj[key]
  }
  return envObj
}
