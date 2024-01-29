// @flow

import React from 'react'
import AgentIdBlock from './AgentIdBlock.js'

type InstructionClauseProps = {
  clause: string,
  column: ?number,
}

const InstructionClause = (props: InstructionClauseProps): any => {
  const { clause, column } = props

  const chopped = splitByIds(clause)
  const result = convertIds(chopped, column)

  return <>{result}</>
}

const idPattern = /(?<!\\)(#\d+)/

function splitByIds(text: string) {
  // Split the text using the pattern and also keep the delimiter (ID) in the result
  const splitText = text.split(idPattern)

  return splitText
}

function convertIds(text: Array<string>, column: ?number) {
  const result = text.map((t, i) => {
    if (idPattern.test(t)) {
      return (
        <AgentIdBlock key={i} agentId={parseInt(t.slice(1))} column={column} />
      )
    } else {
      return t
    }
  })
  return result
}

export default InstructionClause
