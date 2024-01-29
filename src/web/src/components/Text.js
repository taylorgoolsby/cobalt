// @flow

import React from 'react'
import { css } from 'goober'
import classnames from 'classnames'

const styles = {
  text: css`
    white-space: pre-wrap;
  `,
}

type TextProps = {
  children: any,
  className?: string,
  center?: boolean,
  h1?: boolean,
}

const Text = (props: TextProps): any => {
  const { children, className, center, h1, ...rest } = props

  const passProps: any = {
    className: classnames(className, styles.text),
    style: {
      textAlign: center ? 'center' : null,
    },
    ...(rest: any),
  }

  if (h1) {
    return <h1 {...passProps}>{children}</h1>
  } else {
    return <span {...passProps}>{children}</span>
  }
}

export default Text
