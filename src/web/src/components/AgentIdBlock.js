// @flow

import React from 'react'
import { css } from 'goober'
import Colors from '../Colors.js'
import { buttonTransition } from './Button.js'
import classnames from 'classnames'
import mainStore from '../stores/MainStore.js'
import { toJS } from 'mobx'

const styles = {
  block: css`
    display: inline-block;
    background-color: ${Colors.linkBg};
    color: ${Colors.link};
    padding: 0 6px;
    border-radius: 4px;
  `,
}

type AgentIdBlockProps = {
  column: ?number,
  agentId: number,
}

const AgentIdBlock = (props: AgentIdBlockProps): any => {
  const { column, agentId } = props

  function getOtherCard() {
    let columnRef
    let otherCard
    if (column === 0) {
      columnRef = mainStore.registeredCards[1]
      otherCard = mainStore.registeredCards[1]?.[agentId]
    } else if (column === 1) {
      columnRef = mainStore.registeredCards[0]
      otherCard = mainStore.registeredCards[0]?.[agentId]
    }
    return [columnRef, otherCard]
  }

  function handleClick(event: any) {
    event.stopPropagation()

    let [column, otherCard] = getOtherCard()

    if (otherCard) {
      otherCard.open()
      // First setTimeout is needed because when the card is closed,
      // it will be opened, causing a different element to be mounted.
      setTimeout(() => {
        ;[column, otherCard] = getOtherCard()

        if (otherCard?.element) {
          const cardBB = otherCard.element.getBoundingClientRect()
          const scrollerBB = column?.element?.getBoundingClientRect() ?? {
            top: 0,
          }
          column?.element?.scroll(0, cardBB.top - scrollerBB.top)
          otherCard?.element.classList.add('opened-recently')
          otherCard?.element.classList.add('opened-recently-fade')
          setTimeout(() => {
            // second setTimeout is needed to start a transition.
            otherCard?.element.classList?.remove('opened-recently')
          }, 300)
          setTimeout(() => {
            otherCard?.element.classList.remove('opened-recently-fade')
          }, 2300)
        }
      }, 0)
    }
  }

  return (
    <span
      className={classnames(buttonTransition, styles.block)}
      onPointerDown={(event: any) => {
        event.stopPropagation()
      }}
      onClick={handleClick}
    >
      {'#' + agentId}
    </span>
  )
}

export default AgentIdBlock
