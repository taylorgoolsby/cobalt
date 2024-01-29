// @flow

// $FlowFixMe
process.send({
  resumeForking: true, // Tell rebuild-aio to resume forking after mysql has started.
})

process.on('message', (m) => {
  if (m === 'SIGRES') {
    process.exit() // must exit eventually.
  }
})

import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Config from 'common/src/Config.js'
import type { EmailTemplate } from '../rest/MailgunRest.js'

// $FlowFixMe
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const templatesFolder = path.resolve(__dirname, 'templates')

const app: any = express()

// These props are provided to all email templates for local rendering.
// So, when making a new template, try to give the same name for common props.
const defaultProps = {
  link: `${Config.webHost}`,
  code: '000000',
}

function createEndpoint(filename: string) {
  if (!filename.endsWith('.js')) {
    return
  }
  const routeName = filename.slice(0, filename.lastIndexOf('.'))
  const fullPath = path.resolve(__dirname, 'templates', filename)

  console.log(`http://localhost:5555/${routeName}`)
  app.get(`/${routeName}`, async (req, res) => {
    try {
      // $FlowFixMe
      const cl = (await import(fullPath)).default
      const template: EmailTemplate<any, any> = new cl()
      const html = await template.buildHtml(defaultProps)
      res.send(html)
    } catch (err) {
      console.error(err)
      res.send(err.message)
    }
  })
}

const files = fs.readdirSync(templatesFolder)
for (const filename of files) {
  createEndpoint(filename)
}

app.listen(5555)
console.log('email server started on 5555')
