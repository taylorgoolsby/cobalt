// @flow

import { css } from 'goober'
import React from 'react'
import Config from '../Config.js'
import Link from './Link.js'
import sessionStore from '../stores/SessionStore.js'
import { observer } from 'mobx-react-lite'
import classnames from 'classnames'
import { useQuery } from '@apollo/client'
import GetAgency from '../graphql/GetAgency.js'
import { useParams } from 'react-router-dom'
import GetAgencies from '../graphql/GetAgencies.js'

const styles = {
  navbar: css`
    display: flex;
    flex-direction: column;
    height: ${Config.headerHeight}px;
    align-self: stretch;
    align-items: center;
    padding: 0 ${Config.horizontalMargins}px;
    box-sizing: border-box;

    > div {
      display: flex;
      flex-direction: row;
      max-width: ${Config.maxWidth}px;
      width: 100%;
      height: 100%;
      align-items: center;
    }

    table {
      width: 100%;
      table-layout: fixed;
    }

    table,
    tbody,
    td {
      padding: 0;
      margin: 0;
    }

    nav {
      /*width: 100%;*/
      outline: none;
      white-space: nowrap;

      * {
        margin-left: 20px;
        margin-right: 20px;
      }

      *:first-child {
        margin-left: 0;
      }

      *:last-child {
        margin-right: 0;
      }
    }
  `,
  logoCell: css`
    text-align: left;
    /*width: 1%;*/
  `,
  titleCell: css`
    text-align: center;
    /*width: 1%;*/
  `,
  navCell: css`
    text-align: right;
  `,
  logo: css`
    /*font-family: 'Itim', sans-serif;*/
    font-size: 18px;
    margin-right: auto;
    color: rgb(255, 106, 106);
  `,
  text: css`
    display: inline-block;
    vertical-align: baseline;
  `,
  inlineBlock: css`
    display: inline-block;
  `,
  link: css`
    font-size: 18px;
  `,
  align: css`
    vertical-align: baseline;
  `,
}

type HeaderProps = {
  // true when the rendered body is a public profile
  hideNav: boolean,
}

const Header: any = observer((props) => {
  const { hideNav } = props

  const { agencyId } = useParams()
  const res = useQuery(agencyId ? GetAgency : GetAgencies, {
    variables: {
      sessionToken: sessionStore.sessionToken,
      agencyId,
    },
  })
  const agencyName = agencyId
    ? res.data?.viewer?.agency?.name
    : res.data?.viewer?.currentUser?.agencies?.[0]?.name

  return (
    <header className={styles.navbar}>
      <div>
        <table>
          <tbody>
            <tr>
              <td className={classnames(styles.align, styles.logoCell)}>
                <Link
                  className={classnames(styles.logo, styles.text)}
                  href={'/'}
                >
                  {Config.siteName}
                </Link>
              </td>
              {agencyName ? (
                <td className={classnames(styles.align, styles.titleCell)}>
                  {agencyName}
                </td>
              ) : null}
              {!hideNav ? (
                <td className={classnames(styles.align, styles.navCell)}>
                  <div />{' '}
                  {/* This div is used to cause copy+paste to line break. */}
                  <nav className={styles.inlineBlock}>
                    {/*<div className={styles.inlineBlock}>*/}
                    {/*  <Link*/}
                    {/*    href={`/pricing`}*/}
                    {/*    className={classnames(styles.text, styles.link)}*/}
                    {/*  >*/}
                    {/*    Pricing*/}
                    {/*  </Link>*/}
                    {/*</div>*/}
                    {/*<div className={styles.inlineBlock}>*/}
                    {/*  <Link*/}
                    {/*    className={classnames(styles.text, styles.link)}*/}
                    {/*    onClick={RestServiceClient.devSetup}*/}
                    {/*  >*/}
                    {/*    Initialize*/}
                    {/*  </Link>*/}
                    {/*</div>*/}
                    {sessionStore.observables.isLoggedIn ? (
                      <div className={styles.inlineBlock}>
                        <Link
                          className={classnames(styles.text, styles.link)}
                          href={`/settings`}
                        >
                          Settings
                        </Link>
                      </div>
                    ) : null}
                    <div className={styles.inlineBlock}>
                      {sessionStore.observables.isLoggedIn ? (
                        <Link
                          onClick={() => {
                            sessionStore.logout()
                          }}
                          className={classnames(styles.text, styles.link)}
                        >
                          Sign Out
                        </Link>
                      ) : (
                        <Link
                          href={`/auth`}
                          className={classnames(styles.text, styles.link)}
                        >
                          Sign In
                        </Link>
                      )}
                    </div>
                  </nav>
                </td>
              ) : null}
            </tr>
          </tbody>
        </table>
      </div>
    </header>
  )
})

export default Header
