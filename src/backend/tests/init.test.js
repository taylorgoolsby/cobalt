import test from 'tape'
import Version from '../src/mysql/Version.js'

test('initialization', async (t) => {
  const version = await Version.getCurrent()

  console.log('version', version)

  t.pass()
})

test.onFinish(() => {
  process.exit()
})
