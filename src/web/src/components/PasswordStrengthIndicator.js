// @flow

import type { AbstractComponent } from 'react'
import React from 'react'
import { css } from 'goober'
import classnames from 'classnames'
import View from './View.js'
import Colors from '../Colors.js'

const styles = {
  container: css`
    position: relative;
    background-color: ${Colors.blackSoftest};
    height: 8px;
    width: 100px;
    flex-direction: row;
    justify-content: flex-start;
    align-items: stretch;
    align-self: center;

    margin-top: 2px;
  `,
  bar: css``,
}

type PasswordStrengthIndicatorProps = {|
  className?: ?string,
  score: number,
|}

const PasswordStrengthIndicator: AbstractComponent<
  PasswordStrengthIndicatorProps,
> = (props: PasswordStrengthIndicatorProps) => {
  const { className, score } = props

  let borderLeft
  let backgroundColor
  if (score === 0) {
    borderLeft = `1px solid ${Colors.red}`
  } else if (score <= 1) {
    backgroundColor = Colors.yellow
  } else if (score <= 2) {
    backgroundColor = Colors.yellow
  } else if (2 < score) {
    backgroundColor = Colors.green
  }

  return (
    <View
      className={classnames(styles.container, className)}
      style={{
        borderLeft,
      }}
    >
      <View
        className={styles.bar}
        style={{
          backgroundColor,
          width: `${(score / 4) * 100}%`,
        }}
      />
    </View>
  )
}

export default PasswordStrengthIndicator
