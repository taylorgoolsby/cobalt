// @flow

import React from 'react'
import { css } from 'goober'
import classnames from 'classnames'

const cssClass = css`
  height: 1px;
  background-color: black;
  opacity: 0.1;
  width: 100%;
  margin: 0 0px;
`

type Props = {
  className?: string,
  style?: any,
}

const Divider = (props: Props): any => {
  const { className, style } = props

  return <div className={classnames(className, cssClass)} style={style} />
}

export default Divider
