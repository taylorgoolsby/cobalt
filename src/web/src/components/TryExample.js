// @flow

import React, { useRef, useState } from 'react'
import MarkdownText from './MarkdownText.js'
import View from './View.js'
import Button from './Button.js'
import { PiArrowSquareOutBold, PiCopyBold } from 'react-icons/pi'
import { css } from 'goober'
import Colors from '../Colors.js'
import reportEvent from '../utils/reportEvent.js'

const styles = {
  container: css`
    .buttons {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      flex-direction: row;
      align-items: center;

      > *:first-child {
        margin-right: 10px;
      }
    }

    button {
      position: relative;
      display: flex;
      flex-direction: row;
      align-items: center;
      color: white;
      font-size: 16px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      padding: 2px 7px 2px 9px;
      overflow: hidden;
      backdrop-filter: blur(17px);

      span:first-child {
        margin-right: 0.5em;
        font-size: 14px;
        font-family: 'Montserrat', sans-serif;
      }

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }

    .copied {
      position: absolute;
      inset: 0;
      background-color: ${Colors.green};
      color: white;
      justify-content: center;
      align-self: center;
      align-items: center;
      flex-direction: row;

      > span:first-child {
        top: 1px;
        margin: 0;
      }

      &.fade-out {
        transition: opacity 280ms ease-out;
        opacity: 0;
      }
    }

    pre {
      padding-top: 0.25em;
      padding-bottom: 0.25em;
      max-height: calc(20 * 1.5em);
    }
  `,
}

type TryExampleProps = {
  html: string,
}

const TryExample = (props: TryExampleProps): any => {
  const copiedRef = useRef(null)
  const [showCopied, setShowCopied] = useState(false)

  async function handleCopyClick() {
    try {
      await navigator.clipboard.writeText(props.html)
      reportEvent('copy example', {})
      setShowCopied(true)
      setTimeout(() => {
        copiedRef.current?.classList?.add('fade-out')
        setTimeout(() => {
          setShowCopied(false)
        }, 280)
      }, 2000)
    } catch (err) {
      console.error(err)
    }
  }

  const blob = new Blob([props.html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const markdown = `\`\`\`html\n${props.html}\n\`\`\``

  return (
    <View className={styles.container}>
      <MarkdownText className="line-numbers">{markdown}</MarkdownText>
      <View className={'buttons'}>
        <Button onClick={handleCopyClick} disabled={showCopied}>
          <span>Copy</span> <PiCopyBold />
          {showCopied ? (
            <View ref={copiedRef} className={'copied'}>
              <span>Copied</span>
            </View>
          ) : null}
        </Button>
        <Button
          onClick={() => {
            window.open(url, '_blank')
            reportEvent('try example', {})
          }}
        >
          <span>Try</span> <PiArrowSquareOutBold />
        </Button>
      </View>
    </View>
  )
}

export default TryExample
