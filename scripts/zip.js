import mfs from 'micro-fs'

mfs
  .zip('artifact/**/*', 'artifact.zip', {
    dot: true,
  })
  .then(() => {
    console.log('archive done.')
  })
