// @flow

import React from 'react'
import { Guide } from './AgencyPublish.js'
import View from '../components/View.js'
import { css } from 'goober'
import Logo from '../components/Logo.js'
import Link from '../components/Link.js'

const styles = {
  container: css`
    align-self: stretch;
    height: 100%;
    overflow-y: scroll;

    > div {
      max-width: 720px;
      margin: 0 auto;
      width: 100%;
    }

    .link-home {
      position: fixed;
      top: 9px;
      left: 14px;
      padding: 0;
      background-color: transparent;
    }

    @media (max-width: 877px) {
      padding-top: 20px;
      padding-left: 20px;
      padding-right: 20px;

      .link-home {
        position: absolute;
      }
    }
  `,
}

const Docs = (): any => {
  return (
    <View className={styles.container}>
      <Guide />
      <Link className={'link-home'} href={'/'}>
        <Logo />
      </Link>
    </View>
  )
}

export default Docs
