// @flow

import React, { useEffect, useRef } from 'react'
import Text from './Text.js'
import Button from './Button.js'
import { css } from 'goober'
import Colors from '../Colors.js'
import classnames from 'classnames'

const styles = {
  block: css`
    padding: 4px 8px;
    background-color: ${Colors.grey};
    border-radius: 4px;
  `,
}

export const BlockEnum = {
  FREEFORM: 'FREEFORM',
  TO: 'TO',
  FROM: 'FROM',
}

export type BlockType = $Keys<typeof BlockEnum>

type BlockProps = {
  className?: string,
  style?: any,
  type: BlockType,
  onPointerDown?: (event: any) => any,
}

const Block = (props: BlockProps): any => {
  const ref = useRef(null)

  useEffect(() => {
    window.addEventListener('pointerdown', handleClick)

    return () => {
      window.removeEventListener('pointerdown', handleClick)
    }
  }, [])

  function handleClick(e: any) {
    const isClickInside = ref.current && ref.current.contains(e.target)
    if (isClickInside) {
      if (props.onPointerDown) {
        props.onPointerDown(e)
      }
    }
  }

  let label = ''
  if (props.type === BlockEnum.FREEFORM) {
    label = 'Freeform'
  } else if (props.type === BlockEnum.TO) {
    label = 'To'
  } else if (props.type === BlockEnum.FROM) {
    label = 'From'
  }

  let backgroundColor = Colors.grey
  // if (props.type === BlockEnum.FREEFORM) {
  //   backgroundColor = Colors.red
  // } else if (props.type === BlockEnum.TO) {
  //   backgroundColor = Colors.green
  // } else if (props.type === BlockEnum.FROM) {
  //   backgroundColor = Colors.blue
  // }

  return (
    <Button
      ref={ref}
      className={classnames(props.className, styles.block)}
      style={{
        ...props.style,
        backgroundColor,
      }}
    >
      <Text>{label}</Text>
    </Button>
  )
}

export default Block
