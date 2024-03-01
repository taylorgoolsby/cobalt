//@flow

import React from 'react'
import Dialog from '../components/Dialog.js'
import { css } from 'goober'
import mainStore from '../stores/MainStore.js'
import { observer } from 'mobx-react-lite'

const className = css`
  padding: 18px;
  max-width: 700px;
  word-wrap: break-word;
`
const loadTime = Date.now()

type ErrorModalProps = {}

const ErrorModal: any = observer((props: ErrorModalProps) => {
  // const { open, onClose, message } = props

  const message = mainStore.errorModalMessage
  const open = mainStore.showErrorModal

  console.log('mainStore.showErrorModal', mainStore.showErrorModal)

  function onClose() {
    mainStore.setShowErrorModal(false)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      showCloseButton
      useStandardHeader
      title={'Error'}
    >
      <div className={className}>{message}</div>
    </Dialog>
  )
})

export function showErrorModal(message: string): void {
  setTimeout(() => {
    mainStore.setErrorModalMessage(message)
    mainStore.setShowErrorModal(true)
  }, Math.max(1000 - (Date.now() - loadTime), 0))
}

export default ErrorModal
