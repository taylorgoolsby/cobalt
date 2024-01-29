// @flow

import React, { useState } from 'react'
import { css } from 'goober'
import classnames from 'classnames'
import Colors from '../Colors.js'
import { default as NextLink } from 'next/link'
import useHistory from '../utils/useHistory.js'

const styles = {
  text: css`
    color: ${Colors.link};
    background-color: ${Colors.linkBg};
    padding: 0 6px;
    border-radius: 4px;
    /*margin: 0 -6px;*/
    text-decoration: none;
    white-space: nowrap;

    &:hover {
      text-decoration: underline;
      cursor: pointer;
    }

    &[data-spinning='true'],
    &[data-clickable='false'] {
      text-decoration: none;
      cursor: default;
      /*color: ${Colors.blue};
      background-color: unset;*/
      background-color: unset;
    }

    &[data-hidden='true'] {
      opacity: 0;
      cursor: default;
    }
  `,
}

type LinkProps = {
  children?: any,
  className?: any,
  style?: any,
  href?: ?string,
  onClick?: ?(event: any) => any,
  newTab?: ?boolean,
  hide?: ?boolean,
}

const Link = (props: LinkProps): any => {
  const { children, className, style, href, onClick, newTab, hide, ...rest } =
    props

  const newTabProps = newTab
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {}

  const [spinning, setSpinning] = useState(false)

  function handleClick(e: any) {
    if (!onClick) return

    const res = onClick(e)
    if (res instanceof Promise) {
      setSpinning(true)
      res.then(() => {
        setSpinning(false)
      })
    }
  }

  const [history] = useHistory()

  if (!history && href) {
    return (
      <NextLink
        className={classnames(className, styles.text)}
        style={style}
        href={hide ? null : href}
        data-hidden={hide}
        {...newTabProps}
        {...(rest: any)}
      >
        {children}
      </NextLink>
    )
  } else if (history && href) {
    return (
      <a
        className={classnames(className, styles.text)}
        style={style}
        onClick={() => {
          if (hide) return
          if (href.startsWith('http')) {
            window.open(href, '_blank')
            return
          }
          history.push(href)
        }}
        data-hidden={hide}
        {...newTabProps}
        {...(rest: any)}
      >
        {children}
      </a>
    )
  } else {
    return (
      <span
        className={classnames(className, styles.text)}
        style={style}
        onClick={onClick && !hide ? handleClick : null}
        data-clickable={!!onClick && !hide}
        data-spinning={spinning}
        data-hidden={hide}
      >
        {spinning ? '...' : children}
      </span>
    )
  }
}

export default Link
