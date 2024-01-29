// @flow

import type { AbstractComponent } from 'react'
import React, { useState } from 'react'
import { css } from 'goober'
import classnames from 'classnames'
import View from './View.js'
import MfaCodeInput from './MfaCodeInput.js'
import Link from './Link.js'
import Text from './Text.js'
import LineBreak from './LineBreak.js'
import Phone from '../utils/Phone.js'
import VerifyMfaCodeMutation from '../graphql/mutation/VerifyMfaCodeMutation.js'
import sessionStore from '../stores/SessionStore.js'
import SendMfaCodeMutation from '../graphql/mutation/SendMfaCodeMutation.js'
import VerifyPasswordMutation from '../graphql/mutation/VerifyPasswordMutation.js'

const styles = {
  container: css`
    align-items: center;
    text-align: center;
  `,
}

type MfaCodeFieldProps = {|
  className?: ?string,
  callingCode?: ?string,
  phoneNumber?: ?string,
  email?: ?string,
  onVerify: (mfaToken: string) => any,

  // loginEmail and loginPassword are only passed in during MFA for sign in:
  loginUserId?: string,
  loginEmail?: string,
  loginPassword?: string,
|}

const MfaCodeField: AbstractComponent<MfaCodeFieldProps> = (
  props: MfaCodeFieldProps,
) => {
  const {
    className,
    email,
    callingCode,
    phoneNumber,
    onVerify,
    loginUserId,
    loginEmail,
    loginPassword,
  } = props

  const [resendCooldown, setResendCooldown] = useState(false)
  const [showResendCooldownMessage, setShowResendCooldownMessage] =
    useState(false)
  const [showResendConfirmationMessage, setShowResendConfirmationMessage] =
    useState(false)
  const [isValid, setIsValid] = useState(false)
  const [isInvalid, setIsInvalid] = useState(false)

  if (!email && !phoneNumber) {
    console.error('One of either email or phoneNumber must be defined.')
    return null
  }

  if (email && phoneNumber) {
    console.error('email and phoneNumber cannot both be defined.')
    return null
  }

  async function handleResend() {
    if (resendCooldown) {
      setShowResendCooldownMessage(true)
      setTimeout(() => {
        setShowResendCooldownMessage(false)
      }, 5000)
      return
    }

    if (
      !loginUserId &&
      !loginEmail &&
      !loginPassword &&
      sessionStore.sessionToken
    ) {
      // Logged in.
      // MFA is being used to change settings.
      const res = await SendMfaCodeMutation({
        sessionToken: sessionStore.sessionToken,
        email,
        phoneCallingCode: callingCode,
        phoneNumber,
      })
    } else if (loginUserId && loginEmail && loginPassword) {
      // Logged out.
      // MFA is being used to log in.
      const res = await VerifyPasswordMutation({
        email: loginEmail,
        password: loginPassword,
      })
    }

    setResendCooldown(true)
    setTimeout(() => {
      setResendCooldown(false)
    }, 60 * 1000)
    setShowResendConfirmationMessage(true)
    setTimeout(() => {
      setShowResendConfirmationMessage(false)
    }, 5000)
  }

  async function handleSubmit(code: string) {
    const userId = sessionStore?.session?.userId ?? loginUserId
    if (!userId) {
      console.error('missing userId')
      return
    }
    const res = await VerifyMfaCodeMutation({
      userId,
      code,
    })
    if (res?.success) {
      setIsValid(true)
      setIsInvalid(false)
      if (onVerify) onVerify(res?.mfaToken)
    } else {
      setIsValid(false)
      setIsInvalid(true)
    }
  }

  function handleResetValidity() {
    setIsInvalid(false)
  }

  return (
    <View className={classnames(styles.container, className)}>
      <Text>
        {email
          ? `A code was sent to the email address\n${email}.`
          : `A code was sent to the phone number\n${Phone.format(
              callingCode,
              phoneNumber,
            )}.`}
      </Text>
      <LineBreak />
      <MfaCodeInput
        onFilled={handleSubmit}
        isValid={isValid}
        isInvalid={isInvalid}
        onResetValidity={handleResetValidity}
      />
      <LineBreak />
      <Link
        hide={isValid}
        onClick={
          showResendConfirmationMessage || showResendCooldownMessage
            ? null
            : handleResend
        }
      >
        {showResendConfirmationMessage
          ? 'Code Sent!'
          : showResendCooldownMessage
          ? 'Recently Sent. Try Again Soon.'
          : 'Resend Code'}
      </Link>
    </View>
  )
}

export default MfaCodeField
