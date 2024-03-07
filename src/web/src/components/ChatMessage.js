// @flow

import type { FlatMessage } from '../types/Message.js'
import React, { useEffect, useRef } from 'react'
import View from './View.js'
import Text from './Text.js'
import classnames from 'classnames'
import { css } from 'goober'
import type { User } from '../types/User.js'
import type { Agent } from '../types/Agent.js'
import { PiUserBold } from 'react-icons/pi'
import Colors from '../Colors.js'
import MarkdownText from './MarkdownText.js'
import { MessageRole } from '../types/Message.js'
import Button from './Button.js'
import chatStore from '../stores/ChatStore.js'
import mainStore from '../stores/MainStore.js'
import { PiArrowRightBold, PiArrowLeftBold } from 'react-icons/pi'
import { toJS } from 'mobx'
import nonMaybe from 'non-maybe'
import { observer } from 'mobx-react-lite'
import type { Agency } from '../types/Agency.js'

const styles = {
  container: css`
    align-self: stretch;
    flex-direction: column;
    padding: 10px 10px;
    border-radius: 4px;
    font-size: 16px;
    line-height: 28px;

    &.highlight-fade {
      transition: background-color 2000ms;
    }

    /* Opened is set programatically inside AgentIdBlock */
    &.highlight {
      transition: background-color 0ms;
      background-color: ${Colors.yellow};
    }

    .scroll-anchor {
      position: absolute;
      left: 0;
      top: 0;

      &[data-main-chat='true'] {
        top: -78px;
      }
    }

    .row {
      align-self: stretch;
      flex-direction: row;
      box-sizing: border-box;
    }

    .profile-picture {
      width: 24px;
      height: 24px;
      border-radius: 12px;
      margin-right: 10px;
      margin-top: 2px;
      justify-content: center;
      align-items: center;
      background-color: #415d79;
      color: white;
      opacity: 0.5;

      &[data-self='true'] {
        background-color: #3961ff;
      }
    }

    .name {
      font-weight: 500;
    }

    .linked-message {
      align-self: center;
      margin-left: 7px;
      display: flex;
      flex-direction: row;
      align-items: center;
      font-size: 12px;
      background-color: ${Colors.closedCardBg};
      border-radius: 4px;
      height: 18px;
      padding: 1px 6px;

      svg:first-child {
        margin-right: 6px;
      }

      &[data-main-chat='true'] {
        background-color: ${Colors.closedCardBgInverted};
      }
    }

    .message-text {
      padding-left: 34px;
    }

    .controls {
      height: 24px;
      padding-left: 34px;
    }
  `,
}

export const PlacehoderChatMessage = (props: any): any => {
  const { className, color } = props

  return (
    <View className={classnames(styles.container, className)}>
      <View className={'row'}>
        <View className={'profile-picture'} data-self={false}>
          <PiUserBold />
        </View>
        <MarkdownText>
          {`<MessageLoadingIndicator color="${
            color || 'rgba(255, 255, 255, 0.5)'
          }"/>`}
        </MarkdownText>
      </View>
      <MarkdownText className={'message-text'}>{``}</MarkdownText>
      <View className={'controls'}></View>
    </View>
  )
}

type ChatMessageProps = {
  className?: string,
  currentUser?: ?User,
  // onMount?: (message: Message, element: HTMLElement) => void,
  scrollToOnMount?: boolean,
  message: FlatMessage,
  agency: Agency,
  isChatWithUser?: ?boolean,
  indicatorColor?: string,
}

const ChatMessage: (ChatMessageProps) => any = observer(
  (props: ChatMessageProps): any => {
    const {
      className,
      // onMount,
      scrollToOnMount,
      message,
      currentUser,
      agency,
      isChatWithUser,
      indicatorColor,
    } = props

    const agentMap: { [number]: ?Agent } = {}
    for (const agent of agency?.agents ?? []) {
      if (agent.versionId) {
        agentMap[agent.versionId] = agent
      }
    }

    const ref = useRef(null)
    const scrollAnchorRef = useRef(null)
    const mounted = useRef(false)
    const highlightTimeout = useRef<any>(null)
    const highlightFadeTimeout = useRef<any>(null)
    useEffect(() => {
      if (mounted.current) return
      if (!scrollAnchorRef.current) return
      mounted.current = true
      // if (onMount) onMount(message, ref.current)
      if (scrollToOnMount) {
        scrollAnchorRef.current.scrollIntoView({ behavior: 'smooth' })
        ref.current?.classList?.add?.('highlight')
        ref.current?.classList?.add?.('highlight-fade')
        if (highlightTimeout.current) {
          clearTimeout(highlightTimeout.current)
        }
        if (highlightFadeTimeout.current) {
          clearTimeout(highlightFadeTimeout.current)
        }
        highlightTimeout.current = setTimeout(() => {
          highlightTimeout.current = null
          // second setTimeout is needed to start a transition.
          ref.current?.classList?.remove?.('highlight')
        }, 300)
        highlightFadeTimeout.current = setTimeout(() => {
          highlightFadeTimeout.current = null
          ref.current?.classList?.remove?.('highlight-fade')
        }, 2300)
      }
    }, [scrollAnchorRef.current])

    useEffect(() => {
      if (isChatWithUser) {
        chatStore.registerMainChatMessage(
          message.messageId,
          scrollAnchorRef,
          () => {
            if (!scrollAnchorRef.current) return
            scrollAnchorRef.current.scrollIntoView({ behavior: 'smooth' })
            ref.current?.classList?.add?.('highlight')
            ref.current?.classList?.add?.('highlight-fade')
            if (highlightTimeout.current) {
              clearTimeout(highlightTimeout.current)
            }
            if (highlightFadeTimeout.current) {
              clearTimeout(highlightFadeTimeout.current)
            }
            highlightTimeout.current = setTimeout(() => {
              highlightTimeout.current = null
              // second setTimeout is needed to start a transition.
              ref.current?.classList?.remove?.('highlight')
            }, 300)
            highlightFadeTimeout.current = setTimeout(() => {
              highlightFadeTimeout.current = null
              ref.current?.classList?.remove?.('highlight-fade')
            }, 2300)
          },
        )
      } else {
        chatStore.registerMessage(message.messageId, scrollAnchorRef, () => {
          if (!scrollAnchorRef.current) return
          scrollAnchorRef.current.scrollIntoView({ behavior: 'smooth' })
          ref.current?.classList?.add?.('highlight')
          ref.current?.classList?.add?.('highlight-fade')
          if (highlightTimeout.current) {
            clearTimeout(highlightTimeout.current)
          }
          if (highlightFadeTimeout.current) {
            clearTimeout(highlightFadeTimeout.current)
          }
          highlightTimeout.current = setTimeout(() => {
            highlightTimeout.current = null
            // second setTimeout is needed to start a transition.
            ref.current?.classList?.remove?.('highlight')
          }, 300)
          highlightFadeTimeout.current = setTimeout(() => {
            highlightFadeTimeout.current = null
            ref.current?.classList?.remove?.('highlight-fade')
          }, 2300)
        })
      }

      return () => {
        if (isChatWithUser) {
          chatStore.unregisterMainChatMessage(message.messageId)
        } else {
          chatStore.unregisterMessage(message.messageId)
        }
      }
    }, [])

    let name
    if (message.role === MessageRole.SYSTEM) {
      name = 'System'
    } else if (message.fromApi) {
      name = currentUser?.username ?? 'User'
    } else if (message.toApi && message.fromAgentId) {
      // Manager is the only agent that talks to the user.
      name = agentMap[message.fromAgentId]?.name ?? ''
    } else if (message.fromAgentId) {
      name = agentMap[message.fromAgentId]?.name ?? ''
    }

    const profilePictureUrl = null

    const text = message.text ?? ''

    const fromAgent = message.fromAgentId ? agentMap[message.fromAgentId] : null

    // A message is the self if it is from the user when isChatWithUser, or
    // if it is from the message.agentId:
    const isSelf = isChatWithUser
      ? message.fromApi
      : fromAgent?.agentId === message.agentId

    let linkedMessage = null
    if (!isChatWithUser) {
      const clickAction = () => {
        if (message.linkedMessageId) {
          const otherMessage = chatStore.messages[message.linkedMessageId]
          if (otherMessage?.scrollTo) {
            otherMessage?.scrollTo()
          } else {
            // The other agent card is closed.
            const otherAgentId = otherMessage?.message?.agentId ?? 0
            const agentCard = mainStore.registeredCards[0]?.[otherAgentId]
            agentCard.open(otherMessage?.message?.messageId)
          }
        } else if (message.toApi || message.fromApi) {
          const mainChatMessage =
            chatStore.mainChatMessages[nonMaybe(message.messageId)]
          mainChatMessage?.scrollTo?.()
        }
      }

      const otherMessage = message.linkedMessageId
        ? chatStore.messages[message.linkedMessageId]
        : null
      const otherVersionAgentId =
        message.agentId === fromAgent?.agentId
          ? message.toAgentId
          : message.fromAgentId
      const otherName =
        message.toApi || message.fromApi || !otherVersionAgentId
          ? currentUser?.username ?? 'User'
          : agentMap[otherVersionAgentId]?.name ?? ''
      const isToOther = message.toApi
        ? true
        : message.fromApi
        ? false
        : otherVersionAgentId === message.toAgentId
      linkedMessage = (
        <Button className={'linked-message'} onClick={clickAction}>
          {isToOther ? <PiArrowRightBold /> : <PiArrowLeftBold />}
          <Text>{`${otherName}`}</Text>
        </Button>
      )
    } else if (message.fromApi || message.toApi) {
      // This message is appearing in the main chat with the user.
      const clickAction = () => {
        const otherMessage = chatStore.messages[nonMaybe(message.messageId)]
        if (otherMessage?.scrollTo) {
          // The other agent card is open, and ready to scroll to the message.
          otherMessage?.scrollTo()
        } else {
          // The other agent card is closed.
          const otherAgentId = otherMessage?.message?.agentId ?? 0
          const agentCard = mainStore.registeredCards[0]?.[otherAgentId]
          agentCard.open(otherMessage?.message?.messageId)
        }
      }

      const isToOther = !message.toApi
      console.log('agentMap', agentMap)
      console.log('message.toAgentId', message.toAgentId)
      let otherName = ''
      if (message.fromAgentId) {
        otherName = agentMap[message.fromAgentId]?.name ?? ''
      } else if (message.toAgentId) {
        otherName = agentMap[message.toAgentId]?.name ?? ''
      }
      console.log('otherName', otherName)
      linkedMessage = (
        <Button
          className={'linked-message'}
          data-main-chat={isChatWithUser}
          onClick={clickAction}
        >
          {isToOther ? <PiArrowRightBold /> : <PiArrowLeftBold />}
          <Text>{`${otherName}`}</Text>
        </Button>
      )
    }

    return (
      <View ref={ref} className={classnames(styles.container, className)}>
        <View
          className={'scroll-anchor'}
          ref={scrollAnchorRef}
          data-main-chat={isChatWithUser}
        />
        <View className={'row'}>
          <View className={'profile-picture'} data-self={isSelf}>
            {profilePictureUrl ? <PiUserBold /> : <PiUserBold />}
          </View>
          <Text className={'name'}>{name}</Text>
          {/*{linkedMessage}*/}
        </View>
        <MarkdownText className={'row message-text'}>
          {!message.completed
            ? `${text}<MessageLoadingIndicator color="${
                indicatorColor ?? 'rgba(255, 255, 255 0.5)'
              }"/>`
            : text}
        </MarkdownText>
        <View className={'row controls'}></View>
      </View>
    )
  },
)

export default ChatMessage
