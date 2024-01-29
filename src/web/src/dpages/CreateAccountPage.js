// @flow

import React from 'react'
import Body from '../components/Body.js'
import EmailPassword from '../components/EmailPassword.js'
import { css } from 'goober'

const className = css`
  > div {
    width: unset;
  }
`

const CreateAccountPage: any = () => {
  return (
    <Body className={className}>
      <EmailPassword />
    </Body>
  )
}

export default CreateAccountPage
