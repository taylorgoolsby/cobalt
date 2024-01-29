// @flow

import type { AbstractComponent } from 'react'
import React, { useState } from 'react'
import { css } from 'goober'
import View from '../components/View.js'
import { ButtonSquared } from '../components/Button.js'
import LineBreak from '../components/LineBreak.js'
import Wizard from '../components/Wizard.js'
import TextField from '../components/TextField.js'
import zxcvbn from 'zxcvbn'
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator.js'
import Form from '../components/Form.js'

const styles = {
  container: css``,
}

type PasswordPageProps = {|
  onSubmit: () => any,
  password: string,
  onPasswordChange: (value: string) => any,
|}

const PasswordPage: AbstractComponent<PasswordPageProps, any> = (
  props: PasswordPageProps,
) => {
  const { onSubmit, password, onPasswordChange } = props

  const [confirmPassword, setConfirmPassword] = useState('')

  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] =
    useState(false)

  const [isMatching, setIsMatching] = useState(true)

  const [passwordScore, setPasswordScore] = useState(0)
  const [confirmPasswordScore, setConfirmPasswordScore] = useState(0)

  let passwordValidationMessage: any = (
    <PasswordStrengthIndicator score={passwordScore} />
  )

  let confirmPasswordValidationMessage: any = (
    <PasswordStrengthIndicator score={confirmPasswordScore} />
  )

  const isPasswordValid = isMatching && passwordScore >= 1
  const isConfirmPasswordValid = isMatching && confirmPasswordScore >= 1

  const showPasswordValidIcon = !isPasswordFocused && !isMatching
  const showConfirmPasswordValidIcon = !isConfirmPasswordFocused && !isMatching

  if (showPasswordValidIcon && !isMatching) {
    passwordValidationMessage = 'Matching'
  }

  if (showConfirmPasswordValidIcon && !isMatching) {
    confirmPasswordValidationMessage = 'Matching'
  }

  function handlePasswordChange(e: any) {
    const value = e.target.value
    if (onPasswordChange) onPasswordChange(value)
    updateIsMatching(value, confirmPassword)
    updatePasswordScore(value)
  }

  function handleConfirmPasswordChange(e: any) {
    const value = e.target.value
    setConfirmPassword(value)
    updateIsMatching(password, value)
    updateConfirmPasswordScore(value)
  }

  function updateIsMatching(password: string, confirmPassword: string) {
    setIsMatching(password === confirmPassword)
  }

  function updatePasswordScore(password: string) {
    const res = zxcvbn(password)
    setPasswordScore(res.score)
  }

  function updateConfirmPasswordScore(confirmPassword: string) {
    const res = zxcvbn(confirmPassword)
    setConfirmPasswordScore(res.score)
  }

  async function handleSubmit() {
    if (onSubmit) onSubmit()
  }

  return (
    <Form>
      <TextField
        label={'Password'}
        value={password}
        onInput={handlePasswordChange}
        type={'password'}
        showValidIcon={showPasswordValidIcon}
        isValid={isPasswordValid}
        validationMessage={passwordValidationMessage}
        onFocus={() => {
          setIsPasswordFocused(true)
        }}
        onBlur={() => {
          setIsPasswordFocused(false)
        }}
        autoFocus
      />
      <LineBreak />
      <TextField
        label={'Confirm Password'}
        value={confirmPassword}
        onInput={handleConfirmPasswordChange}
        type={'password'}
        showValidIcon={showConfirmPasswordValidIcon}
        isValid={isConfirmPasswordValid}
        validationMessage={confirmPasswordValidationMessage}
        onFocus={() => {
          setIsConfirmPasswordFocused(true)
        }}
        onBlur={() => {
          setIsConfirmPasswordFocused(false)
        }}
      />
      <LineBreak />

      <ButtonSquared
        type={'submit'}
        style={{
          alignSelf: 'flex-end',
        }}
        onClick={handleSubmit}
        disabled={!isPasswordValid || !isConfirmPasswordValid}
      >
        Submit
      </ButtonSquared>
    </Form>
  )
}

type PasswordWizardProps = {|
  onCancel: () => any,
  onComplete: (password: string) => any,
|}

const PasswordWizard: AbstractComponent<PasswordWizardProps> = (
  props: PasswordWizardProps,
) => {
  const { onCancel, onComplete } = props

  const [password, setPassword] = useState('')

  function handlePassswordChange(value: string) {
    setPassword(value)
  }

  function handleComplete() {
    onComplete(password)
  }

  return (
    <Wizard onClose={onCancel}>
      {({ routeIndex, onNextPage }) => {
        if (routeIndex === 0) {
          return (
            <PasswordPage
              onSubmit={handleComplete}
              password={password}
              onPasswordChange={handlePassswordChange}
            />
          )
        }
      }}
    </Wizard>
  )
}

export default PasswordWizard
