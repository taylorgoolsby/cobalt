// @flow

import type { AbstractComponent, Node } from 'react'
import React, { useEffect, useState } from 'react'
import classnames from 'classnames'
import Button from './Button.js'
import { PiCaretDownBold } from 'react-icons/pi'
import FlagIcon from './FlagIcon.js'
import DropdownMenu from './DropdownMenu.js'
import View from './View.js'
import { css } from 'goober'
import Text from './Text.js'

const styles = {
  container: css`
    flex-direction: row;
  `,
  item: css`
    flex-direction: row;
    align-items: center;
  `,
  expandButton: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    align-self: stretch;
    min-width: 46px;

    *:first-child {
      margin-left: 10px;
    }

    * {
      margin: 0 5px;
    }

    *:last-child {
      margin-right: 10px;
    }
  `,
}

export type DropdownInputProps = {|
  className?: ?string,
  items: Array<any>,
  selectedItem: any,
  onChange: (item: any) => void,
  renderItem?: ?(item: any) => Node,
  rightSideCaret?: boolean,
|}

const DropdownInput: AbstractComponent<DropdownInputProps, any> = (
  props: DropdownInputProps,
) => {
  const {
    className,
    items,
    selectedItem,
    onChange,
    renderItem,
    rightSideCaret,
  } = props

  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    // Set a default selected item on mount.
    if (!selectedItem) {
      if (onChange) onChange(items[0])
    }
  }, [selectedItem])

  function toggleMenu() {
    setShowMenu(!showMenu)
  }

  function defaultRenderItem(item: any) {
    return (
      <View className={styles.item}>
        <Text>{item}</Text>
      </View>
    )
  }

  function handleSelect(item: any) {
    if (onChange) onChange(item)
  }

  function handleMenuClose() {
    setShowMenu(false)
  }

  const renderer = renderItem || defaultRenderItem

  return (
    <View className={classnames(styles.container, className)}>
      <Button className={styles.expandButton} onClick={toggleMenu}>
        {!rightSideCaret ? <PiCaretDownBold /> : null}
        {renderer(selectedItem)}
        {rightSideCaret ? <PiCaretDownBold /> : null}
      </Button>
      <DropdownMenu
        show={showMenu}
        items={items}
        renderItem={renderer}
        selectedItem={selectedItem}
        onSelect={handleSelect}
        onClose={handleMenuClose}
      />
    </View>
  )
}

export default DropdownInput
