//@flow

import React, { useEffect, useRef, useState } from 'react'
import Dialog from '../components/Dialog.js'
import { css } from 'goober'
import Image from '../components/Image.js'
import Config from '../Config.js'

const wideClass = css`
  width: 100%;
`

const tallClass = css`
  height: 100%;
`

const className = css`
  display: flex;
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
  }
`

type FullScreenAssetModalProps = {
  open: boolean,
  onClose: () => void,
  src: string,
}

const FullScreenAssetModal = (props: FullScreenAssetModalProps): any => {
  const { open, onClose, src } = props

  const [loaded, setLoaded] = useState(false)
  const [aspect, setAspect] = useState(wideClass)
  const [prevSrc, setPrevSrc] = useState('')
  const [loadedWidth, setLoadedWidth] = useState(0)
  const [loadedHeight, setLoadedHeight] = useState(0)

  useEffect(() => {
    setPrevSrc(src)
  }, [src])

  useEffect(() => {
    const noSrcChange = prevSrc === src
    if (open && noSrcChange) {
      setLoaded(true)
    }
  }, [open])

  function setAspectRatio(width: number, height: number) {
    if (height === 0) return
    // Strangely, a margin of 20 is used on dialogs with margin: auto.
    const screenAspect = (window.innerWidth - 40) / (window.innerHeight - 40)
    const imageAspect = width / height
    if (imageAspect >= screenAspect) {
      setAspect(wideClass)
    } else {
      setAspect(tallClass)
    }
  }

  // call your useEffect
  useEffect(() => {
    const resize = () => setAspectRatio(loadedWidth, loadedHeight)
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [loadedWidth, loadedHeight])

  function onLoad(width: number, height: number) {
    setLoaded(true)
    setLoadedWidth(width)
    setLoadedHeight(height)
    setAspectRatio(width, height)
  }

  function handleClose() {
    setLoaded(false)
    onClose()
  }

  return (
    <Dialog
      className={className}
      open={open && loaded}
      onClose={handleClose}
      onClick={handleClose}
    >
      <Image
        className={aspect}
        key={src}
        src={src}
        isAwsSignedUrl={true}
        onClick={handleClose}
        onLoad={(e) => {
          // $FlowFixMe
          onLoad(e.target.width, e.target.height)
        }}
      />
    </Dialog>
  )
}

export default FullScreenAssetModal
