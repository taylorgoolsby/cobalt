// @flow

import React from 'react'

type FileUploaderProps = {
  inputRef: any,
  onFilesSelected: (files: Array<File>) => void,
}

const FileUploader = (props: FileUploaderProps): any => {
  const { inputRef, onFilesSelected } = props

  async function imageChosen(e: any) {
    e.stopPropagation()
    e.preventDefault()
    onFilesSelected(Array.from(e.target.files ?? []))
  }

  return (
    <input
      ref={inputRef}
      style={{ display: 'none' }}
      type="file"
      accept="image/*,video/*"
      multiple="multiple"
      onChange={imageChosen}
    />
  )
}

export default FileUploader
