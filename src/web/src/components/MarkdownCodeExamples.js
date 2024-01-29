// @flow

import React, { useState } from 'react'
import Tabs from './Tabs.js'
import MarkdownText from './MarkdownText.js'
import { css } from 'goober'

const styles = {
  container: css`
    pre {
      padding-top: 0.5em;
      padding-bottom: 0.5em;
      max-height: calc(20 * 1.5em);
    }

    pre[class*='language-'] {
      border-top-left-radius: 0;
      border-top-right-radius: 0;
    }
  `,
}

type MarkdownCodeExamplesProps = {
  curl?: string,
  python?: string,
  node?: string,
  browser?: string,
  websocket?: string,
  socketio?: string,
}

const MarkdownCodeExamples = (props: MarkdownCodeExamplesProps): any => {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0)

  function handleTabClick(index: number) {
    setSelectedTabIndex(index)
  }

  const data = []
  for (const prop of Object.keys(props)) {
    if (prop === 'curl') {
      data.push({
        label: 'curl',
        render: () => {
          return <MarkdownText>{props.curl}</MarkdownText>
        },
      })
    } else if (prop === 'python') {
      data.push({
        label: 'python',
        render: () => {
          return <MarkdownText>{props.python}</MarkdownText>
        },
      })
    } else if (prop === 'node') {
      data.push({
        label: 'node',
        render: () => {
          return <MarkdownText>{props.node}</MarkdownText>
        },
      })
    } else if (prop === 'browser') {
      data.push({
        label: 'browser',
        render: () => {
          return <MarkdownText>{props.browser}</MarkdownText>
        },
      })
    } else if (prop === 'socketio') {
      data.push({
        label: 'Socket.IO',
        render: () => {
          return <MarkdownText>{props.socketio}</MarkdownText>
        },
      })
    } else if (prop === 'websocket') {
      data.push({
        label: 'WebSocket',
        render: () => {
          return <MarkdownText>{props.websocket}</MarkdownText>
        },
      })
    }
  }

  return (
    <Tabs
      className={styles.container}
      data={data}
      onTabClick={handleTabClick}
      selectedTabIndex={selectedTabIndex}
    />
  )
}

export default MarkdownCodeExamples
