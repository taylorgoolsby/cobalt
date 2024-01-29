// @flow

import type { Node } from 'react'
import React, { useRef, useEffect } from 'react'
import View from './View.js'
import { css } from 'goober'
import Button from './Button.js'
import Colors from '../Colors.js'

const styles = {
  menu: css`
    position: absolute;
    z-index: 10;
    top: 100%;
    left: -1px;
    right: -1px;
    flex-direction: column;
    max-height: ${46 * 5}px;
    overflow: hidden;
    overflow-y: scroll;
    border: 1px solid ${Colors.blackSoftest};
    background-color: white;
  `,
  menuItem: css`
    min-height: 46px;
    align-self: stretch;
    padding: 0 10px;
    overflow: hidden;

    &:hover {
      background-color: rgba(0, 0, 0, 0.03);
    }

    &[data-selected='true'] {
      background-color: rgba(0, 0, 0, 0.1);
    }

    transition: opacity 280ms;
    &:active {
      transition: opacity 0ms;
      opacity: 0.3;
    }
  `,
}

type DropdownMenuProps = {|
  show: boolean,
  items: Array<any>,
  renderItem: (item: any) => Node,
  selectedItem: any,
  onSelect: (item: any) => void,
  onClose: () => void,
|}

const DropdownMenu = (props: DropdownMenuProps): any => {
  const { show, items, renderItem, selectedItem, onSelect, onClose } = props

  const ref = useRef(null)

  // Detect click away:
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (ref.current && !ref.current.contains(event.target)) {
        if (onClose) onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [ref, onClose])

  function handleSelect(item: any) {
    if (onSelect) onSelect(item)
    if (onClose) onClose()
  }

  if (!show) {
    return
  }

  return (
    <View className={styles.menu} ref={ref}>
      {items.map((item) => {
        return (
          <Button
            key={item.toString()}
            className={styles.menuItem}
            onClick={() => handleSelect(item)}
            data-selected={item === selectedItem}
          >
            {renderItem(item)}
          </Button>
        )
      })}
    </View>
  )
}

export default DropdownMenu
