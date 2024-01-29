// @flow

import { useEffect, useState } from 'react'
import type { BlockType } from '../components/Block.js'
import mainStore from '../stores/MainStore.js'

export default function useDragAndDrop(): [
  boolean,
  any,
  number,
  number,
  number,
  number,
  (any, HTMLElement, any) => any,
] {
  const [draggedItem, setDraggedItem] = useState<any>(null)

  const [itemX, setItemX] = useState(0)
  const [itemY, setItemY] = useState(0)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [diffX, setDiffX] = useState(0)
  const [diffY, setDiffY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleDragEnd)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleDragEnd)
    }
  }, [draggedItem])

  function handeDragStart(event: any, element: HTMLElement, item: any) {
    const rect = element?.getBoundingClientRect() || {}

    setItemX(rect.left)
    setItemY(rect.top)
    setStartX(event.clientX)
    setStartY(event.clientY)
    setDiffX(0)
    setDiffY(0)
    setIsDragging(false)

    setDraggedItem(item)
  }

  function handleDragEnd() {
    // setTimeout is needed because the css :active state will not update without it.
    // This happens because the cursor is over the fixed, dragging block, so the pointerup event
    // is not received by the block in the block list, causing it to remain :active.
    setTimeout(() => {
      setDraggedItem(null)
      setIsDragging(false)
    }, 0)
  }

  function handleMove(e: any) {
    if (!draggedItem) {
      return
    }

    window.getSelection().removeAllRanges()

    const nextDiffX = e.clientX - startX
    const nextDiffY = e.clientY - startY
    setDiffX(nextDiffX)
    setDiffY(nextDiffY)

    const diffMouse = Math.sqrt(nextDiffX * nextDiffX + nextDiffY * nextDiffY)
    if (!isDragging && diffMouse > 16) {
      setIsDragging(true)
    }
  }

  return [isDragging, draggedItem, itemX, itemY, diffX, diffY, handeDragStart]
}
