// @flow

import type { AbstractComponent } from 'react'
import React, { useState } from 'react'
import { css } from 'goober'
import { ButtonSquared } from '../components/Button.js'
import LineBreak from '../components/LineBreak.js'
import sessionStore from '../stores/SessionStore.js'
import nonMaybe from 'non-maybe'
import Wizard from '../components/Wizard.js'
import Form from '../components/Form.js'
import TextField from '../components/TextField.js'
import TestOpenAiKeyMutation from '../graphql/mutation/TestOpenAiKeyMutation.js'

const styles = {
  container: css``,
}

type OpenAiKeyPageProps = {|
  onSubmit: (openAiKey: string) => any,
|}

const OpenAiKeyPage: AbstractComponent<OpenAiKeyPageProps, any> = (
  props: OpenAiKeyPageProps,
) => {
  const { onSubmit } = props

  const [openAiKey, setOpenAiKey] = useState('')

  const [isValid, setIsValid] = useState(false)

  async function handleKeyChange(e: any) {
    setOpenAiKey(e.target.value)
    const res = await TestOpenAiKeyMutation({
      sessionToken: nonMaybe(sessionStore.sessionToken),
      openAiKey: e.target.value,
    })
    setIsValid(!!res?.success)
  }

  function handleSubmit() {
    onSubmit(openAiKey)
  }

  return (
    <Form>
      <TextField
        label={'OpenAI API Key'}
        value={openAiKey}
        onInput={handleKeyChange}
        showValidIcon={true}
        isValid={isValid}
        type={'password'}
      />
      <LineBreak />
      <ButtonSquared
        type={'submit'}
        style={{
          alignSelf: 'flex-end',
        }}
        onClick={handleSubmit}
        disabled={!isValid}
      >
        Submit
      </ButtonSquared>
    </Form>
  )
}

type ChangeOpenAiKeyWizardProps = {|
  onCancel: () => any,
  onComplete: (openAiKey: string) => any,
|}

const ChangeOpenAiKeyWizard: AbstractComponent<ChangeOpenAiKeyWizardProps> = (
  props: ChangeOpenAiKeyWizardProps,
) => {
  const { onCancel, onComplete } = props

  function handleComplete(openAiKey: string) {
    onComplete(openAiKey)
  }

  return (
    <Wizard onClose={onCancel}>
      {({ routeIndex, onNextPage }) => {
        if (routeIndex === 0) {
          return <OpenAiKeyPage onSubmit={handleComplete} />
        }
      }}
    </Wizard>
  )
}

export default ChangeOpenAiKeyWizard
