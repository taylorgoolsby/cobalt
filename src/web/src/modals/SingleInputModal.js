// @flow

import React from 'react'
import WizardModal from './WizardModal.js'
import SingleInputWizard from '../wizards/SingleInputWizard.js'
import mainStore from '../stores/MainStore.js'
import { observer } from 'mobx-react-lite'

const SingleInputModal: any = observer((): any => {
  const open = mainStore.showSingleInputModal
  const message = mainStore.singleInputMessage ?? ''
  const inputLabel = mainStore.singleInputLabel ?? ''

  function handleComplete(value: string) {
    mainStore.closeSingleInputModal(value)
  }

  function handleCancel() {
    mainStore.closeSingleInputModal(null)
  }

  return (
    <WizardModal open={open}>
      <SingleInputWizard
        message={message}
        inputLabel={inputLabel}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </WizardModal>
  )
})

export function showSingleInputModal(
  message: string,
  inputLabel: string,
): Promise<?string> {
  return new Promise((resolve) => {
    function callback(value: ?string) {
      resolve(value)
    }

    mainStore.openSingleInputModal(message, inputLabel, callback)
  })
}

export default SingleInputModal
