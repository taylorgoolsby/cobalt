// @flow

import React from 'react'
import Body from '../components/Body.js'
import Auth from '../components/Auth.js'
import { css } from 'goober'

const className = css`
  > div {
    width: unset;
  }
`

const AuthPage = (): any => {
  return <Auth />
}

export default AuthPage
