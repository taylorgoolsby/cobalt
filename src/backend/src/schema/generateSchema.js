process.send({
  resumeForking: true, // Tell rebuild-aio to resume forking after mysql has started.
})

import { printSchemaWithDirectives } from '@graphql-tools/utils'
import fs from 'fs'
import path from 'path'
import { schema } from './schema.js'

const output = printSchemaWithDirectives(schema)

const outPath = path.resolve('schema.graphql')
fs.writeFileSync(outPath, output, { encoding: 'utf-8' })
console.log('created', outPath)
