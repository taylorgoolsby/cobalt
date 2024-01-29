// @flow

import type { AbstractComponent } from 'react'
import React, { useRef, useState } from 'react'
import { css } from 'goober'
import classnames from 'classnames'
import { textFieldClassName } from './TextField.js'
import View from './View.js'
import { PiUserBold } from 'react-icons/pi'
import Button from './Button.js'
import Image from './Image.js'
import Colors from '../Colors.js'
import FileUploader from './FileUploader.js'
import WizardModal from '../modals/WizardModal.js'
import ChangeProfilePictureWizard from '../wizards/ChangeProfilePictureWizard.js'

const styles = {
  inputMods: css``,
  button: css`
    margin-top: 5px;
    width: 68px;
    height: 68px;
    border-radius: 34px;
    overflow: hidden;
  `,
  labelRow: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    > .validation {
      display: flex;
      flex-direction: row;
      align-items: center;

      &[data-valid='true'] {
        color: ${Colors.green};
      }

      &[data-invalid='true'] {
        color: ${Colors.red};
      }

      > svg {
        margin-top: 2px;
        margin-left: 2px;
        margin-right: 2px;
      }
    }
  `,
  placeholder: css`
    width: 100%;
    height: 100%;
    background-color: ${Colors.controlBg};
    justify-content: center;
    align-items: center;
    color: ${Colors.white};
    font-size: 22px;
  `,
}

const Placeholder: any = () => {
  return (
    <View className={styles.placeholder}>
      <PiUserBold />
    </View>
  )
}

type ChangeProfilePictureWizardModalProps = {
  open: boolean,
  onCancel: () => any,
  onComplete: () => any,
  selectedFile: ?File,
}

const ChangeProfilePictureWizardModal: any = (
  props: ChangeProfilePictureWizardModalProps,
) => {
  const { open, onCancel, onComplete, selectedFile } = props

  return (
    <WizardModal open={open}>
      <ChangeProfilePictureWizard
        selectedFile={selectedFile}
        onCancel={onCancel}
        onComplete={onComplete}
      />
    </WizardModal>
  )
}

type ProfilePictureFieldProps = {|
  className?: ?string,
  label?: string,
  src?: ?string,
  onSourceChange?: ?(src: string) => any,
|}

const ProfilePictureField: AbstractComponent<ProfilePictureFieldProps> = (
  props: ProfilePictureFieldProps,
) => {
  const { className, label, src } = props

  const [showModal, setShowModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<?File>(null)

  const filePickerRef = useRef(null)

  function handleClick() {
    filePickerRef?.current?.click()
  }

  function handleImageSelected(selectedFiles: Array<File>) {
    setSelectedFile(selectedFiles[0])
    setShowModal(true)
  }

  function handleCancel() {
    setShowModal(false)
    setSelectedFile(null)
  }

  function handleUploadComplete() {
    setShowModal(false)
    setSelectedFile(null)
  }

  return (
    <View className={classnames(textFieldClassName, styles.inputMods)}>
      <View className={styles.labelRow}>{label || 'Profile'}</View>
      <Button className={styles.button} onClick={handleClick}>
        {src ? <Image src={src} /> : <Placeholder />}
      </Button>
      <FileUploader
        onFilesSelected={handleImageSelected}
        inputRef={filePickerRef}
      />
      <ChangeProfilePictureWizardModal
        open={showModal}
        onCancel={handleCancel}
        onComplete={handleUploadComplete}
        selectedFile={selectedFile}
      />
    </View>
  )
}

export default ProfilePictureField
