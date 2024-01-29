// @flow

import React, { forwardRef } from 'react'
import View from './View.js'
import { css } from 'goober'
import classnames from 'classnames'
import Colors from '../Colors.js'
import type { AbstractComponent } from 'react'

const styles = {
  container: css`
    /*box-shadow: 3.4px 3.4px 2.7px rgba(0, 0, 0, 0.003),
      8.7px 8.7px 6.9px rgba(0, 0, 0, 0.004),
      17.7px 17.7px 14.2px rgba(0, 0, 0, 0.006),
      36.5px 36.5px 29.2px rgba(0, 0, 0, 0.007),
      100px 100px 80px rgba(0, 0, 0, 0.01);*/
    border-radius: 4px;
    border: 1px solid ${Colors.blackSoftest};
  `,
}

type PaperProps = {
  className?: string,
  style?: any,
  children: any,
}

const Paper: AbstractComponent<PaperProps, any> = forwardRef(
  (props: PaperProps, ref): any => {
    return (
      <View
        ref={ref}
        className={classnames(styles.container, props.className)}
        style={props.style}
      >
        {props.children}
      </View>
    )
  },
)

export default Paper
