// @flow

import type { AbstractComponent } from 'react'
import React, { useState } from 'react'
import { css } from 'goober'
import { ButtonSquared } from '../components/Button.js'
import LineBreak from '../components/LineBreak.js'
import Wizard from '../components/Wizard.js'
import Form from '../components/Form.js'
import Text from '../components/Text.js'
import TextField from '../components/TextField.js'

const styles = {
  container: css``,
}

type SingleInputPageProps = {|
  message: string,
  inputLabel: string,
  onSubmit: (value: string) => any,
|}

const SingleInputPage: AbstractComponent<SingleInputPageProps, any> = (
  props: SingleInputPageProps,
) => {
  const { message, inputLabel, onSubmit } = props

  const [value, setValue] = useState('')

  function handleValueChange(e: any) {
    setValue(e.target.value)
  }

  async function handleSubmit() {
    onSubmit(value)
  }

  return (
    <Form>
      <Text center>{message}</Text>
      <LineBreak />
      <TextField
        label={inputLabel}
        value={value}
        onInput={handleValueChange}
        onEnterPress={handleSubmit}
        autoFocus
      />
      <LineBreak />
      <ButtonSquared
        type={'submit'}
        style={{
          alignSelf: 'flex-end',
        }}
        onClick={handleSubmit}
        disabled={!value}
      >
        Submit
      </ButtonSquared>
    </Form>
  )
}

type SingleInputWizardProps = {|
  message: string,
  inputLabel: string,
  onCancel: () => any,
  onComplete: (value: string) => any,
|}

const SingleInputWizard: AbstractComponent<SingleInputWizardProps> = (
  props: SingleInputWizardProps,
) => {
  const { message, inputLabel, onCancel, onComplete } = props

  function handleComplete(value: string) {
    onComplete(value)
  }

  return (
    <Wizard onClose={onCancel}>
      {({ routeIndex, onNextPage }) => {
        if (routeIndex === 0) {
          return (
            <SingleInputPage
              message={message}
              inputLabel={inputLabel}
              onSubmit={handleComplete}
            />
          )
        }
      }}
    </Wizard>
  )
}

export default SingleInputWizard
