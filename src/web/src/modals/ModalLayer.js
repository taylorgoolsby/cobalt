// @flow

import React, { Suspense, lazy, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import ErrorModal from './ErrorModal.js'
import InfoModal from './InfoModal.js'
import ToastModal from './ToastModal.js'
import ConfirmationModal from './ConfirmationModal.js'
import SingleInputModal from './SingleInputModal.js'
import { observable } from 'mobx'
import { observer } from 'mobx-react-lite'

const modalState = observable({
  modalLayerRoot: null,
})

export const MountModal: (props: { children: any }) => any = observer(
  (props: { children: any }): any => {
    // const [modalLayerRoot, setModalLayerRoot] = useState<any>(null)
    // useEffect(() => {
    //   // This useEffect only runs in the browser when used with nextjs.
    //   const modalLayerRoot = document.getElementById('modal-layer')
    //   setModalLayerRoot(modalLayerRoot)
    // }, [])

    const modalLayerRoot = modalState.modalLayerRoot

    if (!modalLayerRoot) {
      // When the page is first loading, modal-layer has not been mounted yet.
      // So Suspense and lazy are used to render nothing.
      // A setTimeout is used to re-attempt rendering later.
      // When lazy resolves, it causes re-rendering of the component which called mountModal,
      // causing it to call mountModal again.
      // This creates a loop where mountModal is repeatedly called until modalLayerRoot is not null.
      const Lazy = lazy(
        () =>
          // $FlowFixMe
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ default: () => null })
            }, 16)
          }),
      )
      return (
        <Suspense fallback={null}>
          <Lazy />
        </Suspense>
      )
    }

    return createPortal(props.children, modalLayerRoot)
  },
)

const ModalLayer = (): any => {
  const ref = useRef<any>(null)

  useEffect(() => {
    if (ref.current) {
      modalState.modalLayerRoot = ref.current
    }
  }, [ref.current])

  return (
    <div
      ref={ref}
      id="modal-layer"
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
      }}
    >
      <SingleInputModal />
      <ConfirmationModal />
      <ErrorModal />
      <InfoModal />
      <ToastModal />
    </div>
  )
}

export default ModalLayer
