// @flow

import type { AbstractComponent } from 'react'
import React, { Component, useEffect, useState } from 'react'
import { css } from 'goober'
import Wizard from '../components/Wizard.js'
import View from '../components/View.js'
import Image from '../components/Image.js'
import RangeInput from '../components/RangeInput.js'

const styles = {
  container: css``,
  croppingPage: css`
    > .masked-image {
      overflow: hidden;
      width: 500px;
      height: 500px;
    }
  `,
  croppingImage: css`
    /*max-width: 500px;
    object-fit: cover;*/
  `,
  croppingMask: css`
    position: absolute;
    inset: 0;
    opacity: 0.5;
  `,
}

const Mask: any = () => {
  return (
    <svg
      className={styles.croppingMask}
      width="100%"
      height="100%"
      viewBox="0 0 200 200"
    >
      <defs>
        <mask id="mask">
          <rect
            fill="#FFF"
            x="0"
            y="0"
            width="200"
            height="200"
            mask="url(#mask)"
          ></rect>
          <circle fill="#000" cx="100" cy="100" r="100" />
        </mask>
      </defs>
      <rect
        fill="#000"
        x="0"
        y="0"
        width="200"
        height="200"
        mask="url(#mask)"
      ></rect>
    </svg>
  )
}

type CroppingPageProps = {
  selectedFile: ?File,
}

class CroppingPage extends Component<CroppingPageProps, any> {
  viewport: ?HTMLElement
  image: ?HTMLImageElement

  constructor(props: CroppingPageProps) {
    super()

    this.state = {
      isPointerDown: false,
      panX: 0,
      panY: 0,
      scale: 1,
      maxImageWidth: null,
      maxImageHeight: null,
    }
  }

  componentDidMount() {
    // window.addEventListener('pointerdown', this.handlePointerDown)
    window.addEventListener('pointerup', this.handlePointerUp)
    window.addEventListener('pointermove', this.handlePointerMove)
  }

  componentWillUnmount() {
    // window.removeEventListener('pointerdown', this.handlePointerDown)
    window.removeEventListener('pointerup', this.handlePointerUp)
    window.removeEventListener('pointermove', this.handlePointerMove)
  }

  handlePointerDown = (e: any) => {
    this.setState({
      isPointerDown: true,
    })
  }

  handlePointerUp = (e: any) => {
    this.setState({
      isPointerDown: false,
    })
  }

  handlePointerMove = (e: any) => {
    const { isPointerDown, panX, panY, scale } = this.state

    if (isPointerDown) {
      this.updatePanning(e.movementX, e.movementY, scale)
    }
  }

  updatePanning = (deltaX: number, deltaY: number, scale: number) => {
    const { panX, panY } = this.state

    if (this.viewport && this.image) {
      const viewportWidth = this.viewport?.getBoundingClientRect()?.width ?? 0
      const viewportHeight = this.viewport?.getBoundingClientRect()?.height ?? 0
      const imageWidth = this.image?.width ?? 0
      const imageHeight = this.image?.height ?? 0

      const extraWidth = (viewportWidth / 2) * scale - viewportWidth / 2
      const extraHeight = (viewportHeight / 2) * scale - viewportHeight / 2

      const maxPanX = extraWidth / scale
      const minPanX = -(imageWidth * scale - viewportWidth - extraWidth) / scale

      const maxPanY = extraHeight / scale
      const minPanY =
        -(imageHeight * scale - viewportHeight - extraHeight) / scale

      const nextPanX = Math.max(
        minPanX,
        Math.min(panX + deltaX / scale, maxPanX),
      )
      const nextPanY = Math.max(
        minPanY,
        Math.min(panY + deltaY / scale, maxPanY),
      )

      this.setState({
        panX: nextPanX,
        panY: nextPanY,
      })
    }
  }

  handleScaleChange = (e: any) => {
    const { scale } = this.state
    const nextScale = e.target.value / 100
    this.setState({
      scale: nextScale,
    })

    this.updatePanning(0, 0, nextScale)
  }

  handleViewportRef = (el: any) => {
    this.viewport = el
  }

  handleImageRef = (el: any) => {
    this.image = el
  }

  handleImageLoad = () => {
    if (!this.state.maxImageHeight && !this.state.maxImageWidth) {
      if (!!this.image && this.image.width > this.image.height) {
        this.setState({
          maxImageHeight: 500,
        })
      } else {
        this.setState({
          maxImageWidth: 500,
        })
      }
    }
  }

  render(): any {
    const { selectedFile } = this.props
    const { scale, panX, panY, maxImageWidth, maxImageHeight } = this.state

    if (!selectedFile) {
      return null
    }

    const url = URL.createObjectURL(selectedFile)

    return (
      <View
        className={styles.croppingPage}
        onPointerDown={this.handlePointerDown}
      >
        <View className="masked-image" ref={this.handleViewportRef}>
          <Image
            ref={this.handleImageRef}
            className={styles.croppingImage}
            src={url}
            style={{
              transformOrigin: `250px 250px`,
              transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
              maxWidth: maxImageWidth,
              maxHeight: maxImageHeight,
            }}
            onLoad={this.handleImageLoad}
          />
          <Mask />
        </View>
        <RangeInput
          value={scale * 100}
          onInput={this.handleScaleChange}
          min={100}
          max={300}
        />
      </View>
    )
  }
}

// const CroppingPage = (props: CroppingPageProps): any => {
//   const {
//     selectedFile
//   } = props
//
//   const [isPointerDown, setIsPointerDown] = useState(false)
//   const [panX, setPanX] = useState(0)
//   const [panY, setPanY] = useState(0)
//   const [scale, setScale] = useState(1)
//
//   function handlePointerDown(e: any) {
//     console.log('e', e)
//     setIsPointerDown(true)
//   }
//
//   function handlePointerUp(e: any) {
//     setIsPointerDown(false)
//   }
//
//   function handlePointerMove(e: any) {
//     console.log('isPointerDown', isPointerDown)
//     if (isPointerDown) {
//       setPanX(panX + e.movementX)
//       setPanY(panY + e.movementY)
//     }
//   }
//
//   useEffect(() => {
//     console.log('setup')
//     window.addEventListener('pointerdown', handlePointerDown)
//     window.addEventListener('pointerup', handlePointerUp)
//     window.addEventListener('pointermove', handlePointerMove)
//
//     return function() {
//       console.log('teardown')
//       window.removeEventListener('pointerdown', handlePointerDown)
//       window.removeEventListener('pointerup', handlePointerUp)
//       window.removeEventListener('pointermove', handlePointerMove)
//     }
//   }, []);
//
//   if (!selectedFile) {
//     return null
//   }
//
//   const url = URL.createObjectURL(selectedFile)
//
//   function handleScaleChange(e: any) {
//     // const nextScale = e.target.value / 100 * 2 + 1
//     const nextScale = e.target.value / 100
//     console.log('nextScale', nextScale)
//     setScale(nextScale)
//   }
//
//   return (
//     <View
//       className={styles.croppingPage}
//       onPointerDown={handlePointerDown}
//       // onPointerUp={handlePointerUp}
//       // onPointerMove={handlePointerMove}
//     >
//       <View className="masked-image">
//         <Image
//           className={styles.croppingImage}
//           src={url}
//           style={{
//             transform: `scale(${scale}) translate(${panX}px, ${panY}px)`
//           }}
//         />
//         <Mask/>
//       </View>
//       <RangeInput value={scale * 100} onInput={handleScaleChange} min={100} max={300}/>
//     </View>
//   )
// }

type ChangeProfilePictureWizardProps = {|
  selectedFile: ?File,
  onCancel: () => any,
  onComplete: () => any,
|}

const ChangeProfilePictureWizard: AbstractComponent<
  ChangeProfilePictureWizardProps,
> = (props: ChangeProfilePictureWizardProps) => {
  const { selectedFile, onCancel, onComplete } = props

  return (
    <Wizard onClose={onCancel}>
      {({ routeIndex, onNextPage }) => {
        if (routeIndex === 0) {
          return <CroppingPage selectedFile={selectedFile} />
        }
      }}
    </Wizard>
  )
}

export default ChangeProfilePictureWizard
