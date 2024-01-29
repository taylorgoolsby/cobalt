// @flow

import React, { useEffect, useState } from 'react'
import View from './View.js'
import Text from './Text.js'
import type { BlockType } from './Block.js'
import Block, { BlockEnum } from './Block.js'
import { css } from 'goober'
import { observer } from 'mobx-react-lite'
import mainStore from '../stores/MainStore.js'

const styles = {
  blockList: css`
    padding: 0 16px;
  `,
  draggedBlock: css`
    position: fixed;
    z-index: 1;
    transform: translate(-50%, -50%);
  `,
  block: css`
    margin: 4px 0;
  `,
}

const BlockList: any = observer(() => {
  const draggedBlockType = mainStore.draggedBlockType
  // const [draggedBlockType, setDraggedBlockType] = useState<?BlockType>(null)
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)

  useEffect(() => {
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleDragEnd)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleDragEnd)
    }
  }, [draggedBlockType])

  function handeDragStart(e: any, type: BlockType) {
    mainStore.setDraggedBlockType(type)
  }

  function handleDragEnd() {
    // setTimeout is needed because the css :active state will not update without it.
    // This happens because the cursor is over the fixed, dragging block, so the pointerup event
    // is not received by the block in the block list, causing it to remain :active.
    setTimeout(() => {
      mainStore.setDraggedBlockType(null)
    }, 0)
  }

  function handleMove(e: any) {
    if (!draggedBlockType) {
      return
    }

    setDragX(e.clientX)
    setDragY(e.clientY)
  }

  return (
    <View className={styles.blockList}>
      <Text>{'Instruction Blocks'}</Text>
      <Block
        key={BlockEnum.FREEFORM}
        type={BlockEnum.FREEFORM}
        className={styles.block}
        onPointerDown={(e) => handeDragStart(e, BlockEnum.FREEFORM)}
      />
      <Block
        key={BlockEnum.TO}
        type={BlockEnum.TO}
        className={styles.block}
        onPointerDown={(e) => handeDragStart(e, BlockEnum.TO)}
      />
      <Block
        key={BlockEnum.FROM}
        type={BlockEnum.FROM}
        className={styles.block}
        onPointerDown={(e) => handeDragStart(e, BlockEnum.FROM)}
      />
      {draggedBlockType ? (
        <Block
          className={styles.draggedBlock}
          type={draggedBlockType}
          style={{
            top: dragY,
            left: dragX,
          }}
        />
      ) : null}
    </View>
  )
})

export default BlockList
