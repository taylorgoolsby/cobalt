// @flow

import type { AbstractComponent } from 'react'
import React from 'react'
import { css } from 'goober'
import { ButtonSquared } from '../components/Button.js'
import LineBreak from '../components/LineBreak.js'
import Wizard from '../components/Wizard.js'
import Form from '../components/Form.js'
import Text from '../components/Text.js'
import View from '../components/View.js'

const styles = {
  container: css``,
}

type AreYouSurePageProps = {|
  onSubmit: () => any,
  onCancel: () => any,
|}

const AreYouSurePage: AbstractComponent<AreYouSurePageProps, any> = (
  props: AreYouSurePageProps,
) => {
  const { onSubmit, onCancel } = props

  return (
    <View>
      <ButtonSquared
        type={'submit'}
        style={{
          alignSelf: 'flex-end',
        }}
        onClick={onSubmit}
      >
        Yes
      </ButtonSquared>
      <LineBreak />
      <ButtonSquared
        type={'submit'}
        small
        style={{
          alignSelf: 'flex-end',
        }}
        onClick={onCancel}
      >
        Nevermind
      </ButtonSquared>
    </View>
  )
}

type AreYouSureWizardProps = {|
  onCancel: () => any,
  onComplete: () => any,
|}

const ConfirmationWizard: AbstractComponent<AreYouSureWizardProps> = (
  props: AreYouSureWizardProps,
) => {
  const { onCancel, onComplete } = props

  function handleComplete() {
    onComplete()
  }

  return (
    <Wizard title={'Are you sure?'} onClose={onCancel}>
      {({ routeIndex, onNextPage }) => {
        if (routeIndex === 0) {
          return (
            <AreYouSurePage onSubmit={handleComplete} onCancel={onCancel} />
          )
        }
      }}
    </Wizard>
  )
}

export default ConfirmationWizard
