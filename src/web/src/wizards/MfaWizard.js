// @flow

import type { AbstractComponent } from 'react'
import React, { useState } from 'react'
import { css } from 'goober'
import MfaCodeField from '../components/MfaCodeField.js'
import PhoneField from '../components/PhoneField.js'
import { ButtonSquared } from '../components/Button.js'
import LineBreak from '../components/LineBreak.js'
import SendMfaCodeMutation from '../graphql/mutation/SendMfaCodeMutation.js'
import sessionStore from '../stores/SessionStore.js'
import nonMaybe from 'non-maybe'
import Wizard from '../components/Wizard.js'
import Form from '../components/Form.js'

const styles = {
  container: css``,
}

type PhoneInputPageProps = {|
  onNextPage: () => any,
  callingCode: string,
  onCallingCodeChange: (value: string) => any,
  phoneNumber: string,
  onPhoneNumberChange: (value: string) => any,
|}

const PhoneInputPage: AbstractComponent<PhoneInputPageProps, any> = (
  props: PhoneInputPageProps,
) => {
  const {
    onNextPage,
    callingCode,
    onCallingCodeChange,
    phoneNumber,
    onPhoneNumberChange,
  } = props

  const [isValid, setIsValid] = useState(false)

  function handleValidityChange(value: any) {
    setIsValid(value)
  }

  async function handleNext() {
    const res = await SendMfaCodeMutation({
      sessionToken: nonMaybe(sessionStore.sessionToken),
      phoneCallingCode: callingCode,
      phoneNumber,
    })
    if (res?.success) {
      if (onNextPage) onNextPage()
    }
  }

  return (
    <Form>
      <PhoneField
        label={'Phone'}
        callingCode={callingCode}
        phoneNumber={phoneNumber}
        onCallingCodeChange={onCallingCodeChange}
        onPhoneNumberChange={onPhoneNumberChange}
        onValidityChange={handleValidityChange}
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
  callingCode: string,
  phoneNumber: string,
  loginUserId: string,
  loginEmail: string,
  loginPassword: string,
|}

const CodeInputPage: AbstractComponent<CodeInputPageProps, any> = (
  props: CodeInputPageProps,
) => {
  const {
    onComplete,
    callingCode,
    phoneNumber,
    loginUserId,
    loginEmail,
    loginPassword,
  } = props

  const [mfaToken, setMfaToken] = useState<any>(null)

  function handleVerify(mfaToken: string) {
    setMfaToken(mfaToken)
  }

  async function handleSubmit() {
    await onComplete(mfaToken)
  }

  return (
    <Form>
      <MfaCodeField
        callingCode={callingCode}
        phoneNumber={phoneNumber}
        loginUserId={loginUserId}
        loginEmail={loginEmail}
        loginPassword={loginPassword}
        onVerify={handleVerify}
      />
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

type MfaWizardProps = {|
  phoneCallingCode: string,
  phoneNumber: string,
  loginUserId: string,
  loginEmail: string,
  loginPassword: string,
  onCancel: () => any,
  onComplete: (mfaToken: string) => any,
|}

const MfaWizard: AbstractComponent<MfaWizardProps> = (
  props: MfaWizardProps,
) => {
  const {
    phoneCallingCode,
    phoneNumber,
    onCancel,
    onComplete,
    loginUserId,
    loginEmail,
    loginPassword,
  } = props

  async function handleComplete(mfaToken: string) {
    await onComplete(mfaToken)
  }

  return (
    <Wizard onClose={onCancel}>
      {({ routeIndex, onNextPage }) => {
        if (routeIndex === 0) {
          return (
            <CodeInputPage
              onComplete={handleComplete}
              callingCode={phoneCallingCode}
              phoneNumber={phoneNumber}
              loginUserId={loginUserId}
              loginEmail={loginEmail}
              loginPassword={loginPassword}
            />
          )
        }
      }}
    </Wizard>
  )
}

export default MfaWizard
