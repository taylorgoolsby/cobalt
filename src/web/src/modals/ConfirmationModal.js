// @flow

import React from 'react'
import WizardModal from './WizardModal.js'
import ConfirmationWizard from '../wizards/ConfirmationWizard.js'
import mainStore from '../stores/MainStore.js'
import { observer } from 'mobx-react-lite'

const ConfirmationModal: any = observer((): any => {
  const open = mainStore.showConfirmationModal

  function handleYes() {
    mainStore.closeConfirmationModal(true)
  }

  function handleNo() {
    mainStore.closeConfirmationModal(false)
  }

  return (
    <WizardModal open={open}>
      <ConfirmationWizard onComplete={handleYes} onCancel={handleNo} />
    </WizardModal>
  )
})

export function showConfirmationModal(): Promise<boolean> {
  return new Promise((resolve) => {
    function callback(outcome: boolean) {
      resolve(outcome)
    }

    mainStore.openConfirmationModal(callback)
  })
}

export default ConfirmationModal
