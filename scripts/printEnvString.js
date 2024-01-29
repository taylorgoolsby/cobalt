import dotenv from 'dotenv-defaults'
import fs from 'fs'

const envContents = fs.readFileSync('./src/common/secrets/.env', {
  encoding: 'utf-8',
})
const envObj = dotenv.parse(envContents)

// Note that `'` characters are treated as literal values.
// No need to wrap the values with single quotes.
const envString = Object.keys(envObj)
  .map((key) => `${key}=${envObj[key]}`)
  .join(',')

console.log(envString) // send to stdout, for example: `echo $(node scripts/setEnvString.js)`
