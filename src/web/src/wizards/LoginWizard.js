// @flow

import type { AbstractComponent } from 'react'
import React from 'react'
import { css } from 'goober'
import Wizard from '../components/Wizard.js'
import Auth from '../components/Auth.js'

const styles = {
  container: css``,
}

type LoginWizardProps = {|
  onCancel: () => any,
  onComplete: () => any,
|}

const LoginWizard: AbstractComponent<LoginWizardProps> = (
  props: LoginWizardProps,
) => {
  const { onCancel, onComplete } = props

  return (
    <Wizard onClose={onCancel}>
      {({ routeIndex, onNextPage }) => {
        if (routeIndex === 0) {
          return <Auth merging={true} onMergeComplete={onComplete} />
        }
      }}
    </Wizard>
  )
}

export default LoginWizard
