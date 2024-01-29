// @flow

if (process.send) {
  process.send({
    resumeForking: true, // Tell rebuild-aio to resume forking after mysql has started.
  })
}

process.on('message', (m) => {
  if (m === 'SIGRES') {
    process.exit() // must exit eventually.
  }
})

import server from './server.js'
import Config from 'common/src/Config.js'

server.listen(Config.port)
console.log(`server started on ${Config.port}`)
