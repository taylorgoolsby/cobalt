// @flow

import React from 'react'
import Text from './Text.js'
import Link from './Link.js'
import { css } from 'goober'
import Config from '../Config.js'

const styles = {
  footer: css`
    position: absolute;
    bottom: 18px;
    left: 0;
    right: 0;
    /*padding: ${Config.verticalMargins}px ${Config.horizontalMargins}px;*/
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;

    font-size: 14px;
    color: white;

    a {
      font-size: 14px;
      color: white;
      background-color: transparent;
      padding: 0;
      margin: 0;
    }
  `,
  nav: css`
    display: flex;
    flex-direction: row;
    max-width: ${Config.maxWidth}px;
  `,
  item: css`
    display: flex;
    padding: 0 8px;
  `,
}

const Footer = (): any => {
  return (
    <footer className={styles.footer}>
      <nav className={styles.nav}>
        {/*These are wrapped in div so that copy and paste generates a new line for each item.*/}
        {/*<div className={styles.item}>*/}
        {/*  <Link href={'/docs'}>Documentation</Link>*/}
        {/*</div>*/}
        {/*<div className={styles.item}>*/}
        {/*  <Link href={'/terms'}>Terms</Link>*/}
        {/*</div>*/}
        {/*<div className={styles.item}>*/}
        {/*  <Link href={'/privacy'}>Privacy Policy</Link>*/}
        {/*</div>*/}
        <div className={styles.item}>
          <Text>{`© ${new Date().getFullYear()}`}</Text>
        </div>
        <div className={styles.item}>
          <Link href="/privacy">{'Privacy'}</Link>
        </div>
        <div className={styles.item}>
          <Link href="/terms">{'Terms'}</Link>
        </div>
        <div className={styles.item}>
          <Link href="/docs">{'Docs'}</Link>
        </div>
        <div className={styles.item}>
          <Link href="https://discord.gg/PUWcfbpYfB">{'Discord'}</Link>
        </div>
      </nav>
    </footer>
  )
}

export default Footer
