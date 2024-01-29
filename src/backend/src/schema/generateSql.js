// @flow

import sqlDirective from 'graphql-to-sql'
import { typeDefs } from './schema.js'
import Config from 'common/src/Config.js'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const { generateSql } = sqlDirective('sql')

// $FlowFixMe
const __dirname = dirname(fileURLToPath(import.meta.url))

export const createScript: string = generateSql(
  { typeDefs: [typeDefs] },
  {
    databaseName: Config.dbDatabase,
    tablePrefix: Config.dbPrefix.sql,
    dbType: 'mysql',
  },
)

const outputFilepath = path.resolve(__dirname, './schema.sql')
fs.writeFileSync(outputFilepath, createScript, { encoding: 'utf-8' })
