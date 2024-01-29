// @flow

import React from 'react'
import type { GroupedProgressEvent } from '../apis/internal/ProjectCreationApi.js'
import type { ProgressEvent } from '../utils/XHRStreamingUpload.js'
import { css } from 'goober'
import Dialog from '../components/Dialog.js'
import classnames from 'classnames'
import Colors from '../Colors.js'

const styles = {
  dialog: css`
    width: 440px;
  `,
  overall: css`
    && {
      padding-top: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
  `,
  individuals: css`
    display: flex;
    flex-direction: column;
    min-height: ${72 * 1 - 16}px;
    max-height: ${72 * 4 - 16}px;
    overflow-y: scroll;
    padding-top: 16px;
    padding-bottom: 16px;

    > div {
      margin-bottom: 16px;
    }

    > div:last-child {
      margin-bottom: 0;
    }
  `,
  progressBar: css`
    padding: 0 16px;

    .bar-name {
      margin-left: 2px;
      line-height: 22px;
    }

    .bar-bg {
      margin-top: 2px;
      min-width: 340px;
      width: 100%;
      height: 32px;
      box-sizing: border-box;
      background-color: rgba(0, 0, 0, 0.1);
      overflow: hidden;
      border-radius: 7px;
    }

    .bar-fg {
      height: 100%;
      background-color: ${Colors.teal};
      transition: width 500ms ease-out;
    }
  `,
}

type ProgressBarProps = {
  className?: ?string,
  name: string,
  progress: ?ProgressEvent,
}

function ProgressBar(props: ProgressBarProps) {
  const { className, name, progress } = props

  const percent = (progress?.ratio ?? 0) * 100

  return (
    <div className={classnames(styles.progressBar, className)}>
      <span className="bar-name">{name}</span>
      <div className="bar-bg">
        <div className="bar-fg" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

type UploadProgressModalProps = {
  open: boolean,
  progress: ?GroupedProgressEvent,
}

const UploadProgressModal = (props: UploadProgressModalProps): any => {
  const { open, progress } = props

  const isMultifile = Object.keys(progress?.individual ?? {})?.length > 1

  return (
    <Dialog className={styles.dialog} open={open} onClose={() => {}}>
      {isMultifile && (
        <ProgressBar
          className={styles.overall}
          name={'Overall'}
          progress={progress?.overall}
        />
      )}
      <div className={styles.individuals}>
        {Object.keys(progress?.individual ?? {}).map((name) => (
          <ProgressBar
            key={name}
            name={name}
            progress={progress?.individual[name]}
          />
        ))}
      </div>
    </Dialog>
  )
}

export default UploadProgressModal
