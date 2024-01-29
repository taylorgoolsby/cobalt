// @flow

import React from 'react'
import View from './View.js'
import { css } from 'goober'
import AgencyList from './AgencyList.js'

const styles = {
  sidePanel: css`
    z-index: 1;
    flex-direction: column;
    align-self: stretch;
  `,
}

const SidePanel: any = () => {
  return (
    <View className={styles.sidePanel}>
      <AgencyList />
    </View>
  )
}

export default SidePanel
