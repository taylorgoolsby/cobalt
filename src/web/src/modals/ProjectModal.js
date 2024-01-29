// @flow

import type { Project, ProjectAsset } from '../types/Project.js'
import React, { useEffect, useRef, useState } from 'react'
import { ButtonSquared } from '../components/Button.js'
import Input from '../components/Input.js'
import Dialog from '../components/Dialog.js'
import { css } from 'goober'
import Form from '../components/Form.js'
import FileUploader from '../components/FileUploader.js'
import Config from '../Config.js'
import ProjectCreationApi, {
  refreshProjects,
} from '../apis/internal/ProjectCreationApi.js'
import AssetGrid from '../components/AssetGrid.js'
import classnames from 'classnames'
import { projectCardStyleBase } from '../components/ProjectCard.js'
import UploadProgressModal from './UploadProgressModal.js'
import FullScreenAssetModal from './FullScreenAssetModal.js'

const styles = {
  dialog: css`
    width: ${Config.maxWidth * 0.8}px;

    &[data-num-assets='0'],
    &[data-num-assets='1'] {
      width: 420px;
    }

    &[data-in-flight='true'] {
      overflow: hidden;
    }
  `,
  titleField: css`
    input {
      width: 100%;
    }
  `,
  descriptionField: css`
    textarea {
      width: 100%;
    }
  `,
  assetGrid: css`
    margin-bottom: 0;
  `,
  spinnerOverlay: css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3);
  `,
  footer: css`
    padding: 8px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  `,
  createFooter: css``,
  adminFooter: css``,
}

type ProjectModalProps = {
  create: boolean,
  project: ?Project,
  open: boolean,
  onClose: (e?: ?Event) => void,
}

const ProjectModal = (props: ProjectModalProps): any => {
  const { create, project, open, onClose } = props

  const fileUploaderRef = useRef(null)

  const [inFlight, setInFlight] = useState(false)
  const [files, setFiles]: [Array<File>, any] = useState([])
  const [progress, setProgress] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [id, setId] = useState('' + Math.random()) // used to refresh values when reopening.

  function initialize() {
    setInFlight(false)
    setFiles([])
    setId('' + Math.random())
    setTitle('')
    setDescription('')
  }

  useEffect(() => {
    if (!open) {
      initialize()
    }
  }, [open])

  async function createPost() {
    if (!title) return

    try {
      setInFlight(true)
      await ProjectCreationApi.createProject(
        title,
        description,
        files,
        (progress) => {
          // $FlowFixMe
          setProgress(progress)
        },
      )
    } catch (err) {
      console.error(err)
    } finally {
      setTimeout(() => {
        refreshProjects().then(() => {
          setInFlight(false)
          if (onClose) onClose()
          // $FlowFixMe
          setProgress({
            overall: { ratio: 0, loaded: 0, total: 0, dLoaded: 0 },
            individual: {},
          })
        })
      }, 500)
    }
  }

  async function deletePost() {
    const projectId = project?.projectId
    if (!projectId) return
    if (onClose) onClose()
    try {
      await ProjectCreationApi.deleteProject(projectId)
    } catch (err) {
      console.error(err)
    }
  }

  function openFilePicker() {
    fileUploaderRef.current?.click()
  }

  function onFilesSelected(selectedFiles: Array<File>) {
    const fileMap = {}
    for (const file of files) {
      // $FlowFixMe
      fileMap[file.name] = file
    }
    for (const file of selectedFiles) {
      // $FlowFixMe
      fileMap[file.name] = file
    }
    // $FlowFixMe
    setFiles(Object.values(fileMap))
  }

  function removeFile(removedFile: File) {
    // $FlowFixMe
    const nextFiles = files.filter((file) => file.name !== removedFile.name)
    setFiles(nextFiles)
  }

  const [showAssetFullScreen, setShowAssetFullScreen] = useState(false)
  const [fullscreenAssetUrl, setFullscreenAssetUrl] = useState('')

  function displayAssetFullScreen() {
    setShowAssetFullScreen(true)
  }

  function closeAssetFullScreen() {
    setShowAssetFullScreen(false)
  }

  function onAssetClick(asset: ProjectAsset | File) {
    const url = asset instanceof File ? URL.createObjectURL(asset) : asset.url
    setFullscreenAssetUrl(url)
    setShowAssetFullScreen(true)
  }

  if (create) {
    const okayToPost = !!files.length && !!title
    return (
      <>
        <Dialog
          className={classnames(projectCardStyleBase, styles.dialog)}
          open={open}
          onClose={onClose}
          data-num-assets={files.length}
          data-in-flight={inFlight}
          showCloseButton
        >
          <Form>
            <div className={classnames(styles.titleField, 'title')}>
              <Input
                key={'New Title' + id}
                onInput={(e) => {
                  setTitle(e.target.value)
                }}
                value={title}
                label={'Title'}
                maxLength={170}
              />
            </div>
            <div className={classnames(styles.descriptionField, 'description')}>
              <Input
                key={'New Description' + id}
                onInput={(e) => {
                  setDescription(e.target.value)
                }}
                value={description}
                label={'Description'}
                multiline={true}
              />
            </div>
            {files.length ? (
              <AssetGrid
                className={styles.assetGrid}
                files={files}
                onRemove={removeFile}
                showAll
              />
            ) : null}
            <div className={classnames(styles.footer, styles.createFooter)}>
              <ButtonSquared onClick={openFilePicker}>Upload</ButtonSquared>
              <ButtonSquared onClick={createPost} disabled={!okayToPost}>
                Post
              </ButtonSquared>
            </div>
          </Form>
          <UploadProgressModal
            key={'progress' + id}
            open={inFlight}
            progress={progress}
          />
        </Dialog>
        <FileUploader
          key={'picker' + id}
          inputRef={fileUploaderRef}
          onFilesSelected={onFilesSelected}
        />
      </>
    )
    //     if (!newlyCreated) {
    //       return (
    //         <Dialog className={styles.dialog} open={open} onClose={onClose}>
    //           <Form>
    //             <TextField
    //               key={'New Name'}
    //               domRef={projectTitleRef}
    //               label={'Project Name'}
    //             />
    //             <Button onClick={createProject}>Create Project</Button>
    //           </Form>
    //         </Dialog>
    //       )
    //     }
  } else if (project && project.projectId) {
    return (
      <Dialog
        className={classnames(projectCardStyleBase, styles.dialog)}
        open={open}
        onClose={onClose}
        data-num-assets={(project.assets || []).length}
        showCloseButton
      >
        <div className="title">
          <span>{project.title}</span>
        </div>
        <div className="description">{project.description}</div>
        <div style={{ flex: 1 }} />
        <AssetGrid
          assets={project.assets}
          showAll
          onAssetClick={onAssetClick}
        />
        <div className={classnames(styles.footer, styles.adminFooter)}>
          <div />
          <ButtonSquared onClick={deletePost}>Delete</ButtonSquared>
        </div>
        <FullScreenAssetModal
          open={showAssetFullScreen}
          onClose={closeAssetFullScreen}
          src={fullscreenAssetUrl}
        />
      </Dialog>
    )
  }
}

export default ProjectModal
