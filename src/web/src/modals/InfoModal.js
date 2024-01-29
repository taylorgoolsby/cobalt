//@flow

import React from 'react'
import Dialog from '../components/Dialog.js'
import { css } from 'goober'
import mainStore from '../stores/MainStore.js'
import { observer } from 'mobx-react-lite'
import { ButtonSquared } from '../components/Button.js'
import View from '../components/View.js'
import LineBreak from '../components/LineBreak.js'

const styles = {
  message: css`
    padding: 18px;
  `,
  children: css`
    align-self: stretch;
    align-items: center;
  `,
  primaryButton: css`
    align-self: center;
    border: none;

    &&:hover {
      border: none;
    }
  `,
  secondaryButton: css`
    align-self: center;
    border: none;

    &&:hover {
      border: none;
    }
  `,
}

export type InfoModalProps = {
  open: boolean,
  title: string,
  message: string,
  primaryActionLabel?: string,
  secondaryActionLabel?: string,
  onPrimary?: () => void,
  onSecondary?: () => void,
  primaryActionDisabled?: boolean,
  secondaryActionDisabled?: boolean,
  onClose?: () => void,
  children?: ?(passProps: any) => any,
  disabledClickOutside?: ?boolean,
}

const InfoModal: any = observer((props: InfoModalProps) => {
  const useProps = {
    ...mainStore.infoModalProps,
    ...props,
  }
  const {
    open,
    title,
    message,
    primaryActionLabel,
    secondaryActionLabel,
    onPrimary,
    onSecondary,
    primaryActionDisabled,
    secondaryActionDisabled,
    onClose,
    children,
    disabledClickOutside,
  } = useProps

  const showPrimaryAction = !!primaryActionLabel
  const showSecondaryAction = !!secondaryActionLabel

  function handleClose() {
    mainStore.closeInfoModal()
    if (onClose) {
      onClose()
    }
  }

  function handlePrimary() {
    if (onPrimary) {
      onPrimary()
    }
  }

  function handleSecondary() {
    if (onSecondary) {
      onSecondary()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      showCloseButton
      useStandardHeader
      title={title}
      disabledClickOutside={disabledClickOutside}
    >
      <div className={styles.message}>{message}</div>
      {children
        ? children({
            className: styles.children,
          })
        : null}
      {showPrimaryAction ? (
        <>
          <LineBreak />
          <ButtonSquared
            primary
            className={styles.primaryButton}
            onClick={handlePrimary}
            disabled={primaryActionDisabled}
          >
            {primaryActionLabel}
          </ButtonSquared>
        </>
      ) : null}
      {showSecondaryAction ? (
        <>
          <LineBreak />
          <ButtonSquared
            secondary
            className={styles.secondaryButton}
            onClick={handleSecondary}
            disabled={secondaryActionDisabled}
          >
            {secondaryActionLabel}
          </ButtonSquared>
        </>
      ) : null}
      <LineBreak />
    </Dialog>
  )
})

export function showInfoModal(props: InfoModalProps): void {
  mainStore.setInfoModalProps(props)
}

export default InfoModal
