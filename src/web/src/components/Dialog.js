// @flow

import React, { useEffect, useRef, useState } from 'react'
import { css } from 'goober'
import classnames from 'classnames'
import { buttonStyles, CloseButton } from './Button.js'
import { MountModal } from '../modals/ModalLayer.js'
import Config from '../Config.js'

const transitionTime = 80

const styles = {
  dialog: css`
    position: fixed;
    padding: 0px;
    box-sizing: content-box;
    border: 1px solid black;
    border-radius: ${Config.borderRadius}px;
    flex-direction: column;
    align-items: stretch;
    color: inherit;
    outline: none;
    /*overflow-y: scroll;*/
    overflow: visible;
    /*min-height: 60px;*/

    &[data-use-standard-header='true'] {
      padding-top: 0px;
    }

    &::backdrop {
      background-color: rgba(0, 0, 0, 0.7);
    }

    &[data-animate='true'] {
      &::backdrop {
        transition: opacity ${transitionTime}ms ease-out;
        opacity: 0;
      }

      transition: opacity ${transitionTime}ms ease-out;
      opacity: 0;
      &[data-ready='true'] {
        opacity: 1;

        &::backdrop {
          opacity: 1;
        }
      }
    }

    .${buttonStyles.buttonSquared} {
      width: 130px;
    }
  `,
  closeButton: css`
    position: absolute;
    top: 0;
    right: 0;
    outline: none;
    height: 60px;
    width: 60px;
    display: flex;
    justify-content: center;
    align-items: center;

    svg {
      color: black;
      font-size: 22px;
    }
  `,
  standardHeader: css`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 60px;
    flex-shrink: 0;
    padding: 0 0 0 18px;
    font-size: 22px;

    > .title {
      font-weight: 700;
    }
  `,
}

type DialogProps = {
  open: boolean,
  onClose?: ?(e: Event) => any,
  onClickInside?: (e: Event) => any,
  children: any,
  showCloseButton?: ?boolean,
  useStandardHeader?: ?boolean,
  title?: ?string,
  className?: ?string,
  style?: ?{ ... },
  disabledClickOutside?: ?boolean,
}

const Dialog = (props: DialogProps): any => {
  const {
    className,
    style,
    children,
    open,
    onClose,
    onClickInside,
    title,
    showCloseButton,
    useStandardHeader,
    disabledClickOutside,
    ...rest
  } = props

  const dialogRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [keepOpen, setKeepOpen] = useState(false)
  const [currentTimeout, setCurrentTimeout] = useState(null)

  const [originalBodyOverflow, setOriginalBodyOverflow] = useState<any>(null)
  const [originalBodyHeight, setOriginalBodyHeight] = useState<any>(null)
  const mounted = useRef(false)
  useEffect(() => {
    if (mounted.current) return
    mounted.current = true

    setOriginalBodyOverflow(document.body?.style.overflow)
    setOriginalBodyHeight(document.body?.style.height)
  }, [])

  useEffect(() => {
    // When Dialog open is set to true, display will be set from none.
    // This mounts with opacity 0.
    // Then this effect sets ready, which sets opacity 1.
    setReady(open)
    if (open) {
      setKeepOpen(true)
      if (currentTimeout) {
        clearTimeout(currentTimeout)
        setCurrentTimeout(null)
      }
    } else {
      // When closing, ready goes false, setting opacity 0.
      // open is already false, so keepOpen is used to wait until transition
      // finishes before allowing display none.
      setCurrentTimeout(
        // $FlowFixMe
        setTimeout(() => {
          setKeepOpen(false)
        }, transitionTime),
      )
    }
  }, [open])

  useEffect(() => {
    if (!dialogRef.current) return

    const firstFrameOpen = open && !keepOpen
    const lastFrameClose = !open && !keepOpen

    if (firstFrameOpen) {
      // $FlowFixMe
      document.body.style.height = '100dvh'
      // $FlowFixMe
      document.body.style.overflow = 'hidden'
      dialogRef.current.showModal()
    } else if (lastFrameClose) {
      dialogRef.current.close()
      if (originalBodyHeight) {
        // $FlowFixMe
        delete document.body.style.height
      } else {
        // $FlowFixMe
        document.body.style.height = originalBodyHeight
      }
      if (originalBodyOverflow) {
        // $FlowFixMe
        delete document.body.style.overflow
      } else {
        // $FlowFixMe
        document.body.style.overflow = originalBodyOverflow
      }
    }
  }, [open, keepOpen])

  const standardHeader = useStandardHeader ? (
    <div className={styles.standardHeader}>{title ?? ''}</div>
  ) : null

  // $FlowFixMe
  const display = open || keepOpen ? style?.display ?? 'flex' : 'none'

  const element = (
    <dialog
      ref={dialogRef}
      style={{
        ...style,
        // $FlowFixMe
        display,
      }}
      data-animate={true}
      data-ready={ready}
      data-use-standard-header={useStandardHeader}
      className={classnames(className, styles.dialog)}
      onClose={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (onClose) onClose(e)
      }}
      onClick={(event) => {
        if (
          event.target.nodeName.toLowerCase() === 'input' &&
          event.target.getAttribute('type') === 'file'
        ) {
          // File picker was clicked, so ignore.
          return
        }
        // If the user clicks outside of the dialog, they click on the dialog::backdrop,
        // so the event.target should be the dialog.
        const dialog = dialogRef.current && event.target === dialogRef.current
        if (dialog) {
          // $FlowFixMe
          const rect = dialogRef.current.getBoundingClientRect()
          const isInDialog =
            rect.top <= event.clientY &&
            event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX &&
            event.clientX <= rect.left + rect.width
          if (!isInDialog && !disabledClickOutside) {
            // $FlowFixMe
            event.stopPropagation()
            // dialogRef.current.close()
            if (onClose) onClose(event)
          }
        }
        // $FlowFixMe
        const isInside = dialogRef.current.contains(event.target)
        if (isInside && onClickInside) {
          onClickInside(event)
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
          if (onClose) onClose(e)
        }
      }}
      onCancel={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (onClose) onClose(e)
      }}
      {...(rest: any)}
    >
      {standardHeader}
      {showCloseButton ? (
        <CloseButton className={styles.closeButton} onClick={onClose} />
      ) : null}
      {children}
    </dialog>
  )

  // return element
  return <MountModal>{element}</MountModal>
}

export default Dialog
