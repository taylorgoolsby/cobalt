// @flow

import type { AbstractComponent } from 'react'
import React, { forwardRef } from 'react'
import { css } from 'goober'
import classnames from 'classnames'

export const viewClassName: string = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  position: relative;
  box-sizing: border-box;

  > * {
    flex-shrink: 0;
  }
`

const styles = {
  view: viewClassName,
}

const View: AbstractComponent<any, any> = forwardRef(
  (props: any, ref: any): any => {
    const { children, className, ...rest } = props

    return (
      <div className={classnames(styles.view, className)} ref={ref} {...rest}>
        {children}
      </div>
    )
  },
)

export default View
