// @flow

import fs from 'fs'
import path, { dirname } from 'path'
import Version from '../schema/Version/VersionInterface.js'
import Config from 'common/src/Config.js'
import { fileURLToPath } from 'url'
import database from './database.js'

// $FlowFixMe
const __dirname = dirname(fileURLToPath(import.meta.url))

export async function migrate() {
  await Version.insertCurrentVersion()
  const version = await Version.getCurrent()
  if (version?.isMigrated) {
    console.log('Migration not needed.')
    return
  }

  const migrationScriptFilename = Config.version.replace(/\./g, '_') + '.sql'
  console.log('Looking for migration file', migrationScriptFilename)
  const migrationScriptPath = path.resolve(
    __dirname,
    '../../migrations',
    migrationScriptFilename,
  )
  const migrationScriptExists = fs.existsSync(migrationScriptPath)
  const migrationScript = migrationScriptExists
    ? fs.readFileSync(migrationScriptPath, { encoding: 'utf-8' }).trim()
    : ''

  if (migrationScript.length > 16777215) {
    throw new Error(
      `migrationScript ${migrationScriptFilename} is greater than max allowed size of MEDIUMTEXT column type.`,
    )
  }

  if (migrationScript) {
    console.log(`Running migration script ${migrationScriptFilename}.`)
    console.log(migrationScript)
    await database.unsafeQuery(migrationScript)
  } else {
    console.log(`No migration script found at ${migrationScriptPath}.`)
  }

  console.log(`Marking version ${Config.version} as complete.`)
  await Version.setMigrated(
    Config.version,
    Config.dbPrefix.sql,
    migrationScript,
  )
  console.log('Migration complete.')
}
