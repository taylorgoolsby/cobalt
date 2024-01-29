// @flow

import React from 'react'
import { css } from 'goober'
import classnames from 'classnames'
import type { ProjectAsset } from '../types/Project.js'
import Button, { buttonTransition } from './Button.js'
import Image from './Image.js'

const removeButtonStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 48px;
  opacity: 0;

  &:hover {
    cursor: pointer;
    opacity: 1;
  }
`

const styles = {
  assetGrid: css`
    display: grid;
    grid-template-columns: [col1] 1fr [col2] 1fr [end];
    grid-template-rows: [row1] 1fr [row2] 1fr [end];
    grid-auto-rows: 1fr 1fr;
    column-gap: 0px;
    row-gap: 0px;
    justify-items: stretch;
    align-items: stretch;
    justify-content: stretch;
    align-content: start;
    aspect-ratio: 1;

    &[data-num-assets='1'] {
      grid-template-areas:
        'asset0 asset0'
        'asset0 asset0';
    }

    &[data-num-assets='2'] {
      grid-template-areas:
        'asset0 asset0'
        'asset1 asset1';

      .asset0 {
        aspect-ratio: 2;
      }

      .asset1 {
        aspect-ratio: 2;
      }
    }

    &[data-num-assets='3'] {
      grid-template-areas:
        'asset0 asset0'
        'asset1 asset2';

      .asset0 {
        aspect-ratio: 2;
      }
    }

    &[data-num-assets='4'] {
      grid-template-areas:
        'asset0 asset1'
        'asset2 asset3';
    }

    .asset0 {
      grid-area: asset0;
    }

    .asset1 {
      grid-area: asset1;
    }

    .asset2 {
      grid-area: asset2;
    }

    .asset3 {
      grid-area: asset3;
    }
  `,
  assetGroup: css`
    position: relative;
    aspect-ratio: 1;
  `,
  asset: css`
    object-fit: cover;
    width: 100%;
    aspect-ratio: inherit;
  `,
}

type AssetGridProps = {
  className?: ?string,
  assets?: ?Array<ProjectAsset>,
  files?: ?Array<File>,
  onRemove?: ?(file: File) => void,
  showAll?: ?boolean,
  onLoad?: () => void,
  onAssetClick?: (ProjectAsset | File) => void,
}

const AssetGrid = (props: AssetGridProps): any => {
  const { className, assets, files, onRemove, showAll, onLoad, onAssetClick } =
    props

  const fileAssets: Array<{
    url: string,
    type: string,
    dateCreated: number,
    file: File,
  }> = (files ?? []).map((file, i) => {
    const url = URL.createObjectURL(file)
    let type = ''
    if (file.type.startsWith('image/')) {
      type = 'image'
    } else if (file.type.startsWith('video/')) {
      type = 'video'
    }

    return {
      url,
      type,
      dateCreated: i,
      file,
    }
  })
  let readyAssets = assets ? assets : fileAssets

  return (
    <div
      className={classnames(className, styles.assetGrid)}
      data-num-assets={readyAssets?.length}
    >
      {readyAssets?.map((asset, i) => {
        if (!showAll && i >= 4) {
          return null
        }

        let child
        if (asset.type === 'image') {
          child = (
            <Image
              className={classnames(styles.asset, {
                [buttonTransition]: !!onAssetClick,
              })}
              src={asset.url}
              isAwsSignedUrl={!!assets}
              onLoad={onLoad}
              onClick={
                onAssetClick
                  ? () => {
                      onAssetClick(asset)
                    }
                  : null
              }
            />
          )
        } else if (asset.type === 'video') {
          child = (
            <video className={styles.asset} controls>
              <source src={asset.url} />
            </video>
          )
        } else {
          console.warn(`Unsupported asset type ${asset.type}`)
        }

        if (!!files) {
          const removeButton = (
            <div className={removeButtonStyle}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                fill="currentColor"
                stroke="currentColor"
                className="bi bi-x"
                viewBox="0 0 16 16"
              >
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
              </svg>
            </div>
          )
          return (
            <Button
              // $FlowFixMe
              key={asset.file.name}
              className={classnames(styles.assetGroup, {
                [`asset${i}`]: readyAssets.length <= 4,
              })}
              data-file={!!files}
              // $FlowFixMe
              onClick={files ? () => onRemove(asset.file) : null}
              tabIndex={-1}
            >
              {child}
              {removeButton}
            </Button>
          )
        } else {
          return (
            <div
              key={asset.url}
              className={classnames(styles.assetGroup, {
                [`asset${i}`]: readyAssets.length <= 4,
              })}
              data-file={!!files}
              // $FlowFixMe
              onClick={files ? () => onRemove(asset.file) : null}
            >
              {child}
            </div>
          )
        }
      })}
    </div>
  )
}

export default AssetGrid
