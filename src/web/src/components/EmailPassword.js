// @flow

import React, { useState } from 'react'
import Form from './Form.js'
import TextField from './TextField.js'
import LineBreak from './LineBreak.js'
import { ButtonSquared } from './Button.js'
import Text from './Text.js'
import Link from './Link.js'
import { css } from 'goober'
import validator from 'validator'
import CreateAccountMutation from '../graphql/mutation/CreateAccountMutation.js'
import InfoModal from '../modals/InfoModal.js'
import type { CreateAccountResponse } from '../graphql/mutation/CreateAccountMutation.js'
import ToastModal from '../modals/ToastModal.js'
import useHistory from '../utils/useHistory.js'

const styles = {
  form: css`
    display: flex;
    flex-direction: column;
    align-items: center;
  `,
}

const EmailPassword: any = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inFlight, setInFlight] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showResentModal, setShowResentModal] = useState(false)

  const [history] = useHistory()

  const canSubmit = validator.isEmail(email) && !!password
  const isDisabled = inFlight || !canSubmit

  function handleEmailChange(e: any) {
    setEmail(e.target.value)
  }

  function handlePasswordChange(e: any) {
    setPassword(e.target.value)
  }

  async function send(): Promise<?CreateAccountResponse> {
    if (inFlight) {
      return
    }
    if (!canSubmit) {
      return
    }
    setInFlight(true)
    const res = await CreateAccountMutation({
      email,
      password,
    })
    setInFlight(false)
    return res
  }

  async function createAccount() {
    const res = await send()
    if (res?.done) {
      setShowInfoModal(true)
    }
  }

  async function resendEmail() {
    const res = await send()
    if (res?.done) {
      setShowResentModal(true)
    }
  }

  function closeInfoModal() {
    setShowInfoModal(false)
  }

  function goToAuthPath() {
    setShowInfoModal(false)
    history?.push('/auth')
  }

  function closeResendModal() {
    setShowResentModal(false)
  }

  return (
    <Form className={styles.form}>
      <Text>{'Create an Account'}</Text>
      <LineBreak />
      <TextField
        label={'Email'}
        value={email}
        onInput={handleEmailChange}
        disabled={inFlight}
      />
      <LineBreak />
      <TextField
        label={'Password'}
        type={'password'}
        value={password}
        onInput={handlePasswordChange}
        onEnterPress={createAccount}
        disabled={inFlight}
      />
      <LineBreak />
      <LineBreak />
      <ButtonSquared onClick={createAccount} disabled={isDisabled}>
        {'Create Account'}
      </ButtonSquared>
      <Text style={{ margin: '10px 0' }}>{'or'}</Text>
      <Link
        onClick={() => {
          history?.push('/auth')
        }}
      >
        {'Sign In'}
      </Link>
      <InfoModal
        open={showInfoModal}
        title={'Account Creation'}
        message={'To complete account creation, please check your email.'}
        primaryActionLabel={'Got it'}
        secondaryActionLabel={'Resend'}
        primaryActionDisabled={isDisabled}
        secondaryActionDisabled={isDisabled}
        onPrimary={goToAuthPath}
        onSecondary={resendEmail}
        onClose={closeInfoModal}
      />
      <ToastModal
        open={showResentModal}
        message={'Resent!'}
        onClose={closeResendModal}
      />
    </Form>
  )
}

export default EmailPassword
