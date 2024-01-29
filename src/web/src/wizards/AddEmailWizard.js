// @flow

import type { AbstractComponent } from 'react'
import React, { useState } from 'react'
import { css } from 'goober'
import MfaCodeField from '../components/MfaCodeField.js'
import { ButtonSquared } from '../components/Button.js'
import LineBreak from '../components/LineBreak.js'
import SendMfaCodeMutation from '../graphql/mutation/SendMfaCodeMutation.js'
import sessionStore from '../stores/SessionStore.js'
import nonMaybe from 'non-maybe'
import Wizard from '../components/Wizard.js'
import Form from '../components/Form.js'
import TextField from '../components/TextField.js'
import validator from 'validator'

const styles = {
  container: css``,
}

type EmailInputPageProps = {|
  onNextPage: () => any,
  email: string,
  onEmailChange: (value: string) => any,
|}

const EmailInputPage: AbstractComponent<EmailInputPageProps, any> = (
  props: EmailInputPageProps,
) => {
  const { onNextPage, email, onEmailChange } = props

  const [isValid, setIsValid] = useState(false)

  function handleEmailChange(e: any) {
    if (onEmailChange) onEmailChange(e)
    setIsValid(validator.isEmail(e.target.value))
  }

  function handleValidityChange(value: any) {
    setIsValid(value)
  }

  async function handleNext() {
    const res = await SendMfaCodeMutation({
      sessionToken: nonMaybe(sessionStore.sessionToken),
      email,
    })
    if (res?.success) {
      if (onNextPage) onNextPage()
    }
  }

  return (
    <Form>
      <TextField
        label={'Email'}
        value={email}
        onInput={handleEmailChange}
        showValidIcon={true}
        isValid={isValid}
      />
      <LineBreak />
      <ButtonSquared
        type={'submit'}
        style={{
          alignSelf: 'flex-end',
        }}
        onClick={handleNext}
        disabled={!isValid}
      >
        Next
      </ButtonSquared>
    </Form>
  )
}

type CodeInputPageProps = {|
  onComplete: (mfaToken: string) => any,
  email: string,
|}

const CodeInputPage: AbstractComponent<CodeInputPageProps, any> = (
  props: CodeInputPageProps,
) => {
  const { onComplete, email } = props

  const [mfaToken, setMfaToken] = useState<any>(null)

  function handleVerify(mfaToken: string) {
    setMfaToken(mfaToken)
  }

  function handleSubmit() {
    onComplete(mfaToken)
  }

  return (
    <Form>
      <MfaCodeField email={email} onVerify={handleVerify} />
      <LineBreak />
      <ButtonSquared
        type={'submit'}
        style={{
          alignSelf: 'flex-end',
        }}
        onClick={handleSubmit}
        disabled={!mfaToken}
      >
        Submit
      </ButtonSquared>
    </Form>
  )
}

type AddEmailWizardProps = {|
  onCancel: () => any,
  onComplete: (mfaToken: string, email: string) => any,
|}

const AddEmailWizard: AbstractComponent<AddEmailWizardProps> = (
  props: AddEmailWizardProps,
) => {
  const { onCancel, onComplete } = props

  const [email, setEmail] = useState('')

  function handleEmailChange(e: any) {
    setEmail(e.target.value)
  }

  function handleComplete(mfaToken: string) {
    onComplete(mfaToken, email)
  }

  return (
    <Wizard onClose={onCancel}>
      {({ routeIndex, onNextPage }) => {
        if (routeIndex === 0) {
          return (
            <EmailInputPage
              onNextPage={onNextPage}
              email={email}
              onEmailChange={handleEmailChange}
            />
          )
        } else if (routeIndex === 1) {
          return <CodeInputPage onComplete={handleComplete} email={email} />
        }
      }}
    </Wizard>
  )
}

export default AddEmailWizard
