// @flow

import React from 'react'
import { css } from 'goober'
import Config from '../Config.js'
import classnames from 'classnames'

const styles = {
  body: css`
    display: flex;
    flex-direction: row;
    align-self: stretch;
    flex: 1;
    align-items: stretch;
    /*padding: ${Config.verticalMargins}px ${Config.horizontalMargins}px;*/
    /*width: 520px;*/
    box-sizing: border-box;

    /*> div {
      /!*max-width: ${Config.maxWidth}px;*!/
      width: 100%;
      box-sizing: border-box;
      /!*align-items: stretch;*!/
      flex: 1;
      flex-direction: row;
    }*/
    @media (max-width: 600px) {
      /* CSS rules for screens smaller than 600px */
      flex-direction: column;
    }
  `,
}

type BodyProps = {
  className?: string,
  children: any,
}

const Body = (props: BodyProps): any => {
  const { className, children } = props

  return <main className={classnames(className, styles.body)}>{children}</main>
}

export default Body
