//@flow

import React from 'react'
import Dialog from '../components/Dialog.js'
import { css } from 'goober'
import mainStore from '../stores/MainStore.js'
import { observer } from 'mobx-react-lite'

const styles = {
  dialog: css`
    && {
      min-height: unset;
    }
  `,
  message: css`
    padding: 18px;
  `,
}

export type ToastModalProps = {
  open: boolean,
  message: string,
  onClose?: () => void,
}

const ToastModal: any = observer((props: ToastModalProps) => {
  const useProps = {
    ...mainStore.toastModalProps,
    ...props,
  }
  const { open, message, onClose } = useProps

  function handleClose() {
    mainStore.closeToastModal()
    if (onClose) {
      onClose()
    }
  }

  return (
    <Dialog
      className={styles.dialog}
      open={open}
      onClose={handleClose}
      onClickInside={handleClose}
    >
      <div className={styles.message}>{message}</div>
    </Dialog>
  )
})

export function showToastModal(props: ToastModalProps): void {
  mainStore.setToastModalProps(props)
}

export default ToastModal
