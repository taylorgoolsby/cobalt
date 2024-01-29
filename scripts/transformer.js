import flowRemoveTypes from 'flow-remove-types'
import fs from 'fs'
import path from 'path'
import babel from '@babel/core'

// filepath and outputPath are absolute paths.
export default async function transform(filepath, outputPath, contents) {
  const filename = path.relative(path.resolve(outputPath, '../'), outputPath)

  // Remove type annotations, and possibly generate sourcemaps:
  const flowOut = flowRemoveTypes(contents)
  const flowConverted = flowOut.toString()
  // const flowMap = flowOut.generateMap()
  // fs.writeFileSync(
  //   path.resolve(outputPath, '../', `${filename}.map`),
  //   JSON.stringify(flowMap),
  //   { encoding: 'utf-8' },
  // )

  let babelConverted = flowConverted
  if (filepath.match(/email\/(?:templates|components)\/.+\.js$/)) {
    // Email templates use JSX, so they require babel transformation
    babelConverted = babel.transformSync(flowConverted, {
      presets: ['@babel/preset-react'],
    }).code
  }

  return babelConverted
}
