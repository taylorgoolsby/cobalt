process.send({
  pauseForking: true, // Tell rebuild-aio to pause forking.
})

import { start, stop } from './localMysqlInterface.js'
const port = 3306

process.on('message', async (m) => {
  if (m === 'SIGRES') {
    // await stop(port)
    // console.log('graceful mysql shutdown')
    process.exit() // must exit eventually.
  }
})

await start(port)

process.send({
  resumeForking: true, // Tell rebuild-aio to resume forking after mysql has started.
})
