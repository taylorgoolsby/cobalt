// @flow

import type { AbstractComponent, Node } from 'react'
import React, { useState } from 'react'
import { css } from 'goober'
import classnames from 'classnames'
import View from './View.js'
import { BackButton, CloseButton } from './Button.js'
import Text from './Text.js'

const styles = {
  container: css``,
  navRow: css`
    align-self: stretch;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    min-height: 60px;

    .title {
      margin-left: 24px;
      margin-right: 76px;
      font-size: 21px;
    }
  `,
  wrapper: css`
    align-self: stretch;
    padding: 22px;
    align-items: center;
  `,
}

const NavRow: any = (props) => {
  const { title, routeIndex, setRouteIndex, onClose } = props

  function handleBack() {
    setRouteIndex(routeIndex - 1)
  }

  return (
    <View className={styles.navRow}>
      {routeIndex > 0 ? <BackButton onClick={handleBack} /> : null}
      {title ? <Text className={'title'}>{title}</Text> : null}
      <CloseButton onClick={onClose} />
    </View>
  )
}

export type RouteProps = {|
  routeIndex: number,
  onNextPage: () => void,
|}

export type WizardProps = {|
  title?: ?string,
  className?: ?string,
  onClose: () => any,
  children: (renderProps: RouteProps) => Node,
|}

const Wizard: AbstractComponent<WizardProps> = (props: WizardProps) => {
  const { title, className, onClose, children } = props

  const [routeIndex, setRouteIndex] = useState(0)

  function handleNextPage() {
    setRouteIndex(routeIndex + 1)
  }

  return (
    <View className={classnames(styles.container, className)}>
      <NavRow
        title={title}
        routeIndex={routeIndex}
        setRouteIndex={setRouteIndex}
        onClose={onClose}
      />
      <View className={styles.wrapper}>
        {children({
          routeIndex,
          onNextPage: handleNextPage,
        })}
      </View>
    </View>
  )
}

export default Wizard
