// @flow

import React from 'react'
import { css } from 'goober'
import Colors from '../Colors.js'

const styles = {
  logo: css`
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 18px;
    line-height: 28px;
    width: 48px;
    height: 34px;
    border-radius: 4px;

    font-family: 'Righteous', sans-serif;
    color: ${Colors.link};
    background-color: ${Colors.linkBg};

    > span {
      position: relative;
      top: -1px;
    }

    &[data-round='true'] {
      border-radius: 17px;
    }
  `,
}

type Props = {
  round?: ?boolean,
}

const Logo = (props: Props): any => {
  const { round } = props

  return (
    <div className={styles.logo} data-round={!!round}>
      <span>a.g</span>
    </div>
  )
}

export default Logo
