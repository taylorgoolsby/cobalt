// @flow

import React, { useEffect, useState } from 'react'
import Dialog from './Dialog.js'
import Link from './Link.js'
import { MountModal } from '../modals/ModalLayer.js'

const un = 'IiZSzyRFKX8zYHwvOSzc8pOmwz3Wmdzv+lsmqlDybD0='
const encrypted =
  'UEJLREYy--U0hBLTUxMg==--MTAwMDAw--En8u7uxJUJUpR8sDRIosbw==--MjU2---QUVTLUdDTQ==--gnlUPcg5JHR3YNbs--GzenSrp+TTFJ/clMy//TO+5NCJSIFEbiE7tQxmisZq4YQZ8nXu/rrHvm'

// Uncomment this to generate a new encrypted message:
// $FlowFixMe
// import(/* webpackIgnore: true */ 'https://esm.sh/occulto@2.0.1').then(
//   async ({ AES }: any): any => {
//     const message = 'mailto:contact@cobalt.online'
//     const encrypted = await AES.encryptEasy(message, un)
//     console.log("encrypted", encrypted)
//   }
// )

const TIME = 30

async function decrypt() {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const { AES } = await import(
        // $FlowFixMe
        /* webpackIgnore: true */ 'https://esm.sh/occulto@2.0.1'
      )
      const decrypted = await AES.decryptEasy(encrypted, un)
      resolve(decrypted)
    }, TIME * 1000)
  })
}

const ContactDialog = (props: any): any => {
  const { open, onClose } = props

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={'Loading Email'}
      useStandardHeader={true}
    >
      <span
        style={{
          padding: '0 20px 10px 20px',
        }}
      >{`As a bot prevention measure, email takes ${TIME} seconds to load.`}</span>
    </Dialog>
  )
}

const Contact = (): any => {
  const [value, setValue] = useState('mailto:[loading...]')
  const [resolved, setResolved] = useState(false)
  const [showModal, setShowModal] = useState(false)

  function openModal() {
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
  }

  useEffect((): any => {
    decrypt().then((nextValue) => {
      // $FlowFixMe
      setValue(nextValue)
      setResolved(true)
    })
  })

  return (
    <>
      <Link
        href={resolved ? value : null}
        onClick={!resolved ? openModal : null}
      >
        {value.slice(7)}
      </Link>
      <MountModal>
        <ContactDialog open={showModal} onClose={closeModal} />
      </MountModal>
    </>
  )
}

export default Contact
