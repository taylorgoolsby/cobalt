// @flow

import React from 'react'
import { css } from 'goober'
import BounceLoader from 'react-spinners/BounceLoader'
import Colors from '../Colors.js'

const styles = {
  container: css`
    display: inline-block;
    width: 22px;
    height: 22px;
    border-radius: 11px;
    /*background-color: white;*/
    margin-left: 6px;
    position: relative;
    top: 2px;
  `,
}

const MessageLoadingIndicator = (props: any): any => {
  const { color } = props

  return (
    <BounceLoader
      className={styles.container}
      size={16}
      cssOverride={{
        display: 'inline-block',
      }}
      color={color || 'rgba(255, 255, 255, 0.5)'}
    ></BounceLoader>
  )
}

export default MessageLoadingIndicator
