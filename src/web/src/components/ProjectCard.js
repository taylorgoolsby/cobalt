// @flow

import React, { forwardRef, useState } from 'react'
import type { Project, ProjectAsset } from '../types/Project.js'
import AssetGrid from './AssetGrid.js'
import { css } from 'goober'
import ProjectModal from '../modals/ProjectModal.js'
import Button from './Button.js'
import classnames from 'classnames'

export const projectCardStyleBase: string = css`
  display: flex;
  flex-direction: column;
  align-items: stretch;

  .title {
    font-weight: 700;
    height: 60px;
    flex-shrink: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-left: 14px;
    padding-right: 60px;
    font-size: 22px;

    > span,
    > input {
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }
  }

  .description {
    min-height: 1.222222222222222em;
    margin-bottom: 16px;
    margin-left: 12px;
    margin-right: 12px;
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
`

const projectCardStyle = css`
  overflow: hidden;
  box-shadow: 0 12px 24px -12px rgba(0, 0, 0, 0.5);
`

type ProjectCardProps = {
  id?: string,
  className?: string,
  style?: { ... },
  project: Project,
}

const ProjectCard: any = forwardRef(
  (props: ProjectCardProps, ref: any): any => {
    const { id, className, style, project } = props

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [imagesLoaded, setImagesLoaded] = useState(false)

    const assets = project.assets?.slice(0, 4) ?? []

    function openModal() {
      setIsModalOpen(true)
    }

    function closeModal(e: any) {
      setIsModalOpen(false)
    }

    function onLoad() {
      // console.log('loaded', props.project.title)
      setImagesLoaded(true)
    }

    return (
      <Button
        ref={ref}
        id={id}
        className={classnames(
          className,
          projectCardStyleBase,
          projectCardStyle,
        )}
        onClick={openModal}
        style={{
          ...style,
          // $FlowFixMe
          // ...(!imagesLoaded ? { display: 'none', } : null)
        }}
      >
        {/*<div className="title">{project.title}</div>*/}
        {/*<div className="description">{project.description}</div>*/}
        {/*<div style={{ flex: 1 }} />*/}
        <AssetGrid assets={assets} onLoad={onLoad} />
        <ProjectModal
          create={false}
          project={project}
          open={isModalOpen}
          onClose={closeModal}
        />
      </Button>
    )
  },
)
export default ProjectCard
