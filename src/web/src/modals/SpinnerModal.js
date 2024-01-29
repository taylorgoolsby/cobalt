//@flow

import React, { useEffect, useState } from 'react'
import Dialog from '../components/Dialog.js'
import { css } from 'goober'
import Config from '../Config.js'

const className = css`
  padding: 16px;
  /*display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  background-color: transparent;
  border: 1px transparent solid;

  img {
    object-fit: contain;
    border-radius: ${Config.borderRadius}px;
    overflow: hidden;
  }*/
`

type SpinnerModalProps = {
  open: boolean,
}

const SpinnerModal = (props: SpinnerModalProps): any => {
  const { open } = props

  // const [actuallyOpen, setActuallyOpen] = useState(false)
  // const [openTime, setOpenTime] = useState(0)
  // useEffect(() => {
  //   if (open) {
  //     setActuallyOpen(open)
  //     setOpenTime(Date.now())
  //   } else {
  //     const elapsed = Date.now() - openTime
  //     if (elapsed < 300) {
  //       setTimeout(() => {
  //         setActuallyOpen(false)
  //       }, 300 - elapsed)
  //     } else {
  //       setActuallyOpen(open)
  //     }
  //   }
  // }, [open])

  const [manuallyClosed, setManuallyClosed] = useState(true)
  const [isUpdated, setIsUpdated] = useState(false)
  useEffect(() => {
    if (open) {
      setManuallyClosed(false)
      setIsUpdated(false)
    } else {
      setIsUpdated(true)
    }
  }, [open])
  const actuallyOpen = open || !manuallyClosed
  function handleClose() {
    setManuallyClosed(true)
  }

  return (
    <Dialog
      className={className}
      open={actuallyOpen}
      onClose={handleClose}
      onClickInside={handleClose}
    >
      <div>{isUpdated ? 'Updated' : 'Updating...'}</div>
    </Dialog>
  )
}

export default SpinnerModal
