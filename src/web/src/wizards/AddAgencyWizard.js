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
import Text from '../components/Text.js'

const styles = {
  container: css``,
}

type AgencyDetailsPageProps = {|
  onSubmit: (name: string) => any,
|}

const AgencyDetailsPage: AbstractComponent<AgencyDetailsPageProps, any> = (
  props: AgencyDetailsPageProps,
) => {
  const { onSubmit } = props

  const [name, setName] = useState('')

  function handleNameChange(e: any) {
    setName(e.target.value)
  }

  async function handleSubmit() {
    onSubmit(name)
  }

  return (
    <Form>
      <Text center>Give a name to your agency.</Text>
      <LineBreak />
      <TextField
        label={'Name'}
        value={name}
        onInput={handleNameChange}
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
        disabled={!name}
      >
        Submit
      </ButtonSquared>
    </Form>
  )
}

type AddAgencyWizardProps = {|
  onCancel: () => any,
  onComplete: (name: string) => any,
|}

const AddAgencyWizard: AbstractComponent<AddAgencyWizardProps> = (
  props: AddAgencyWizardProps,
) => {
  const { onCancel, onComplete } = props

  function handleComplete(name: string) {
    onComplete(name)
  }

  return (
    <Wizard onClose={onCancel}>
      {({ routeIndex, onNextPage }) => {
        if (routeIndex === 0) {
          return <AgencyDetailsPage onSubmit={handleComplete} />
        }
      }}
    </Wizard>
  )
}

export default AddAgencyWizard
