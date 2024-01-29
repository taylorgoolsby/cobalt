// @flow

import React, { useState } from 'react'
import { css } from 'goober'
import View from './View.js'
import Text from './Text.js'
import Button from './Button.js'
import Divider from './Divider.js'
import Colors from '../Colors.js'
import classnames from 'classnames'

const styles = {
  container: css`
    align-self: stretch;
  `,
  tabsHeader: css`
    flex-direction: row;
    align-self: stretch;
    justify-content: space-around;

    button {
      flex: 1;
      display: flex;
      align-self: stretch;
      justify-content: center;
      padding: 10px;
    }
  `,
  tabItem: css`
    background-color: ${Colors.cardItemBg};

    &[data-selected='true'] {
      background-color: transparent;
    }

    &[disabled=''] {
      background-color: ${Colors.cardItemBg};
      color: ${Colors.disabled};
    }
  `,
}

type TabItem = {
  label: string,
  render: () => any,
  disabled?: boolean,
}

type TabsHeaderProps = {
  data: Array<TabItem>,
  onTabClick: (index: number) => any,
  selectedTabIndex: number,
}

const TabsHeader = (props: TabsHeaderProps): any => {
  const { data, selectedTabIndex } = props

  return (
    <View className={styles.tabsHeader}>
      {data.map(({ label, disabled }, i) => {
        return (
          <Button
            key={i}
            className={styles.tabItem}
            onClick={() => props.onTabClick(i)}
            data-selected={i === selectedTabIndex}
            disabled={disabled}
          >
            <Text>{label}</Text>
          </Button>
        )
      })}
    </View>
  )
}

type TabsProps = {
  className?: ?string,
  data: Array<TabItem>,
  initialTabIndex?: number,
}

const Tabs = (props: TabsProps): any => {
  const { className, initialTabIndex } = props

  const [selectedTabIndex, setSelectedTabIndex] = useState(initialTabIndex ?? 0)

  const labels = props.data.map((d) => d.label)

  function handleTabClick(index: number) {
    setSelectedTabIndex(index)
  }

  const renderFunction = props.data[selectedTabIndex].render

  return (
    <View className={classnames(styles.container, className)}>
      <TabsHeader
        data={props.data}
        onTabClick={handleTabClick}
        selectedTabIndex={selectedTabIndex}
      />
      <Divider />
      {renderFunction()}
    </View>
  )
}

export default Tabs
