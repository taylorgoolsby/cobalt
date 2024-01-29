// @flow

import type { AbstractComponent } from 'react'
import React from 'react'
import { css } from 'goober'
import classnames from 'classnames'
import PulseLoader from 'react-spinners/PulseLoader'
import GridLoader from 'react-spinners/GridLoader'
import View from './View.js'
import Colors from '../Colors.js'

const styles = {
  container: css`
    flex-direction: row;
    white-space: nowrap;
    overflow: hidden;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    justify-content: center;
    align-items: center;

    > span {
      display: inline;
      white-space: initial;
    }

    &[data-small='true'] {
      > span {
        transform: scale(0.5);
      }
    }
  `,
}

type SpinnerProps = {|
  className?: ?string,
  style?: any,
  color?: string,
  primary?: boolean,
  speedMultiplier?: number,
  size?: number,
  small?: boolean,
  buttonSpinner?: boolean,
|}

const Spinner: AbstractComponent<SpinnerProps> = (props: SpinnerProps) => {
  const {
    className,
    style,
    color,
    primary,
    small,
    size,
    buttonSpinner,
    speedMultiplier,
  } = props

  return (
    <View
      className={classnames(styles.container, className)}
      style={style}
      data-small={small}
    >
      {buttonSpinner ? (
        <PulseLoader
          size={size ? size : 15}
          color={color ? color : primary ? Colors.white : Colors.black}
          speedMultiplier={speedMultiplier}
        />
      ) : (
        <GridLoader
          color={color ? color : primary ? Colors.white : Colors.black}
          size={size ? size : 3}
          speedMultiplier={speedMultiplier}
        />
      )}
    </View>
  )
}

export default Spinner
