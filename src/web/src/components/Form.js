// @flow

import React from 'react'
import { css } from 'goober'
import classnames from 'classnames'
import { viewClassName } from './View.js'

const formStyle = css`
  align-items: stretch;
  margin-bottom: 0;
`

type FormProps = {
  className?: ?string,
  style?: ?{ ... },
  children: any,
  onSubmit?: () => void,
  disabled?: boolean,
}

const Form = (props: FormProps): any => {
  const { className, style, children, onSubmit, disabled } = props

  return (
    <form
      className={classnames(className, viewClassName, formStyle)}
      style={style}
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (onSubmit) {
          onSubmit()
        }
      }}
    >
      {children}
    </form>
  )
}

export default Form
