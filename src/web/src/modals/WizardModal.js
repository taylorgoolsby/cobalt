// @flow

import type { AbstractComponent } from 'react'
import React from 'react'
import { css } from 'goober'
import classnames from 'classnames'
import Dialog from '../components/Dialog.js'

const styles = {
  container: css`
    .cl {
    }
  `,
}

type WizardModalProps = {|
  className?: ?string,
  style?: any,
  open: boolean,
  children: any,
|}

const WizardModal: AbstractComponent<WizardModalProps> = (
  props: WizardModalProps,
) => {
  const { className, style, open, children } = props

  // todo: when pressing escape, the event is caught by the dialog, but if a wizard is mounted inside the dialog,
  //  then the wizard should handle the event to call the wizard's onCancel.

  return (
    <Dialog
      className={classnames(styles.container, className)}
      open={open}
      style={style}
    >
      {open ? children : null}
    </Dialog>
  )
}

export default WizardModal
