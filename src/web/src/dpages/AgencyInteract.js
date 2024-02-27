// @flow

import type { AbstractComponent } from 'react'
import React, { forwardRef, useEffect, useRef, useState } from 'react'
import View from '../components/View.js'
import { css } from 'goober'
import type { User } from '../types/User.js'
import type { Agency } from '../types/Agency.js'
import Colors from '../Colors.js'
import { useQuery } from '@apollo/client'
import GetAgencyDetails from '../graphql/GetAgencyDetails.js'
import nonMaybe from 'non-maybe'
import sessionStore from '../stores/SessionStore.js'
import type { Agent } from '../types/Agent.js'
import AgentCard from '../components/AgentCard.js'
import type { FlatMessage } from '../types/Message.js'
import ChatMessage, {
  PlacehoderChatMessage,
} from '../components/ChatMessage.js'
import Input from '../components/Input.js'
import Button from '../components/Button.js'
import {
  PiArrowUpBold,
  PiCaretLeftBold,
  PiCaretRightBold,
  PiPencilSimple,
} from 'react-icons/pi'
import Text from '../components/Text.js'
import GetAgencyConversations from '../graphql/GetAgencyConversations.js'
import type { AgencyConversation } from '../types/AgencyConversation.js'
import type { AgentConversation } from '../types/AgentConversation.js'
import fadingGradient from '../utils/fadingGradient.js'
import Spinner from '../components/Spinner.js'
import type {
  NewChatOutput,
  UpdateNameOutput,
} from '../websocket/socketHandler.js'
import { sendNewChat, sendNewMessage } from '../websocket/socketHandler.js'
import chatStore from '../stores/ChatStore.js'
import { observer } from 'mobx-react-lite'
import classnames from 'classnames'
import mainStore from '../stores/MainStore.js'
import reportEvent from '../utils/reportEvent.js'
import { toJS } from 'mobx'
import useHistory from '../utils/useHistory.js'

const agentPanelDefaultWidth = 300

const styles = {
  container: css`
    align-self: stretch;
    flex: 1;
    flex-direction: row;
    background-color: ${Colors.panelBg};
  `,
  chat: css`
    align-self: stretch;
    flex: 1;

    .top-background-cover {
      position: sticky;
      top: 0;
      /*left: 0;
      right: 0;*/
      width: 100%;
      height: ${10 + 34 - 10}px;
      background-color: ${Colors.panelBg};
      z-index: 1;
    }

    .top-fade {
      position: sticky;
      top: ${10 + 34 - 10}px;
      /*left: 0;*/
      /*right: 0;*/
      width: 100%;
      height: 44px;
      background: ${fadingGradient(196, 219, 255)};
      z-index: 1;
    }

    .messages {
      align-self: stretch;
      flex: 1;
      align-items: stretch;
      overflow-x: hidden;
      overflow-y: scroll;
      max-height: 100dvh;
      /* 34 is the height of the past conversations button */
      /*padding-top: ${10 + 34 + 10}px;*/
      /* 86px is the height of the chatInput.background-cover */
      padding-bottom: ${86 + 32}px;

      > .message-item {
        margin: 0 auto;
        width: 100%;
        max-width: 620px;
      }

      @media (max-width: 600px) {
        max-height: calc(100dvh - 52px);
      }
    }

    .agency-version-wrap {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 2;

      .button {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        align-items: center;
        min-width: 120px;
        max-width: 282px;
        height: 34px;
        min-height: 34px;
        padding: 0 16px;
        border-radius: 4px;
        background-color: transparent;

        > span {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          min-width: 0;
          /*font-family: 'Sometype Mono', monospace;*/
          opacity: 0.3;
          font-size: 12px;
        }

        /*&:hover:not([disabled='']):not([disabled='true']):not(
          [data-small='true']
        ) {
          background-color: rgba(255, 255, 255, 0.22);
            /!*background-color: ${Colors.blackSoftest};*!/
        }*/
      }
    }

    .settings-button {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 2;

      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      min-width: 120px;
      max-width: 282px;
      height: 34px;
      min-height: 34px;
      padding: 0 16px;
      border-radius: 4px;
      background-color: transparent;

      > span {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        min-width: 0;
        /*font-family: 'Sometype Mono', monospace;*/
        /*opacity: 0.3;*/
        font-size: 16px;
      }

      &:hover:not([disabled='']):not([disabled='true']):not(
          [data-small='true']
        ) {
        background-color: rgba(255, 255, 255, 0.22);
        /*background-color: ${Colors.blackSoftest};*/
      }
    }
  `,
  chatInput: css`
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 10px;

    > .background-cover {
      background-color: ${Colors.panelBg};
      padding-bottom: 32px;
      border-radius: 4px;
      width: 100%;
      max-width: 602px;
    }

    .input-border {
      flex-direction: row;
      width: 100%;
      align-self: center;
      border-radius: 4px;
      border: 1px solid white;
      min-height: 52px;
      min-width: 52px;
      overflow: hidden;

      textarea {
        flex: 1;
        padding: 0.875em 52px 0.875em 16px;
        max-height: 200px;
        line-height: 24px;
        font-size: 16px;
      }

      .submit-button {
        position: absolute;
        bottom: 0;
        right: 0;
        display: flex;
        width: 50px;
        height: 50px;
        justify-content: center;
        align-items: center;
        padding: 12px;
        background-color: ${Colors.panelBg};

        > div {
          border-radius: 4px;
          justify-content: center;
          align-items: center;
          flex: 1;
          align-self: stretch;
          background-color: white;
          color: black;
        }

        &[disabled='']:not([data-is-submitting='true']),
        &[disabled='true']:not([data-is-submitting='true']) {
          > div {
            background-color: rgba(0, 0, 0, 0.3);
            color: ${Colors.panelBg};
          }
        }

        &[data-is-submitting='true'] {
          > div {
            background-color: black;
            opacity: 0.17;
          }
        }
      }
    }
  `,
  agents: css`
    flex-direction: column;
    align-self: stretch;
    width: ${agentPanelDefaultWidth}px;
    z-index: 2;

    @media (max-width: 600px) {
      transition: width 150ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    &[data-is-dragging='true'] {
      user-select: none;
    }

    > .scroller {
      flex: 1;
      align-self: stretch;
      overflow-y: scroll;
      max-height: 100dvh;
      background-color: white;

      @media (max-width: 600px) {
        max-height: calc(100dvh - 52px);
      }
    }

    .toggle-agent-panel-button {
      position: absolute;
      top: 0;
      right: 100%;
      width: 35px;
      height: 50px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 22px;
    }
  `,
  edge: css`
    z-index: 10;
    position: absolute;
    top: 0;
    left: -4px;
    bottom: 0;
    width: 8px;
    background-color: rgba(0, 0, 0, 0);

    &:hover,
    &[data-is-dragging='true'] {
      background-color: rgba(0, 0, 0, 0.1);
      cursor: grab;
    }
  `,
  conversations: css`
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 2;

    .button {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-items: center;
      min-width: 120px;
      max-width: 282px;
      height: 34px;
      min-height: 34px;
      padding: 0 16px;
      border-radius: 4px;
      background-color: transparent;

      > span {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        min-width: 0;
      }

      &:hover:not([disabled='']):not([disabled='true']):not(
          [data-small='true']
        ) {
        background-color: rgba(255, 255, 255, 0.22);
        /*background-color: ${Colors.blackSoftest};*/
      }
    }

    .pane {
      flex-direction: column;
      position: absolute;
      top: 44px;
      left: 0;
      /*height: 60vh;*/
      max-height: calc(100dvh - 153px);
      width: 300px;
      /*background-color: ${Colors.bakedBlackSoftestOverPanelBg};*/
      background-color: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(17px);
      /*border: 1px solid ${Colors.blackSoft};*/
      border-radius: 4px;
      padding: 10px 10px;
      overflow-y: scroll;

      &:hover {
        /*border: 1px solid ${Colors.black50};*/
      }

      button {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        height: 34px;
        padding: 0 16px;
        border-radius: 4px;
        background-color: transparent;

        &:not(:last-child) {
          margin-bottom: 10px;
        }

        > span {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          min-width: 0;
        }

        &:hover {
          /*background-color: ${Colors.blackSoftest};*/
          background-color: rgba(255, 255, 255, 0.5);
        }

        &[data-selected='true'] {
          /*background-color: ${Colors.blackSoftest};*/
          background-color: rgba(255, 255, 255, 0.5);
        }
      }
    }

    .pane[data-is-open='false'] {
      display: none;
    }
  `,
}

type ChatInputProps = {
  inputRef: any,
  value: string,
  isSubmitting: boolean,
  onInput: (event: any) => any,
  onSubmit: (message: string) => any,
}

const ChatInput = (props: ChatInputProps): any => {
  const { inputRef, value, isSubmitting, onInput, onSubmit } = props

  function handleSubmit(event: any) {
    if (event.shiftKey) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    onSubmit(value)
    reportEvent('send message', {})
  }

  return (
    <View className={styles.chatInput} data-is-submitting={isSubmitting}>
      <View className={'background-cover'}>
        <View className={'input-border'}>
          <Input
            ref={inputRef}
            multiline
            placeholder={'Message Agency...'}
            value={value}
            onInput={onInput}
            onEnterPress={handleSubmit}
            // disabled={isSubmitting}
            autoFocus
          />
          <Button
            className={'submit-button'}
            data-is-submitting={isSubmitting}
            disabled={!value || isSubmitting}
            onClick={onSubmit}
          >
            <View>
              {isSubmitting ? <Spinner primary /> : <PiArrowUpBold />}
            </View>
          </Button>
        </View>
      </View>
    </View>
  )
}

type ChatProps = {
  currentUser: User,
  agency: Agency,
  onSubmit: (message: string) => any,
  isUserWaiting: boolean,

  chatListRef: any,
  selectedConversation: ?AgencyConversation,
  onSelectConversation: (agencyConversation: ?AgencyConversation) => any,
  agencyConversations: Array<AgencyConversation>,
  isLoading: boolean,
}

const Chat = observer((props: ChatProps): any => {
  const {
    currentUser,
    agency,
    // managerConversation,
    onSubmit,
    isUserWaiting,
    chatListRef,
    selectedConversation,
    onSelectConversation,
    agencyConversations,
    isLoading,
  } = props

  const orderedMessageIds =
    chatStore.orderedMessageIds[chatStore.managerAgentId ?? 0] ?? []
  const messages: Array<FlatMessage> = orderedMessageIds
    .map((messageId) => chatStore.messages[messageId].message)
    .filter((message) => message.toApi || message.fromApi)

  // Check if there are any messages which are in writing state:
  const hasWriting = messages.some((message) => {
    return !message.completed
  })

  const res = useQuery(GetAgencyDetails, {
    variables: {
      sessionToken: nonMaybe(sessionStore.sessionToken),
      agencyId: selectedConversation?.agencyId ?? agency?.agencyId,
    },
  })

  const agents: Array<Agent> = res.data?.viewer?.agency?.agents ?? []

  const agentMap: { [number]: ?Agent } = {}
  for (const agent of agents) {
    if (agent.agentId) {
      agentMap[agent.agentId] = agent
    }
  }

  const lastMessage = messages[messages.length - 1]

  const inputRef = useRef(null)

  const scrollRef = useRef(null)
  const [stickyScrolling, setStickyScrolling] = useState(false)
  useEffect(() => {
    if (!scrollRef.current) return

    function handleScroll(event: any) {
      const scrollElement = scrollRef.current
      const scrollHeight = scrollElement?.scrollHeight ?? 0
      const scrollTop = scrollElement?.scrollTop ?? 0
      const clientHeight = scrollElement?.clientHeight ?? 0
      const scrollBottom = scrollHeight - scrollTop - clientHeight
      const isAtBottom = scrollBottom < 1

      if (isAtBottom) {
        setStickyScrolling(true)
      } else {
        setStickyScrolling(false)
      }
    }

    scrollRef.current.addEventListener('scroll', handleScroll)

    return () => {
      scrollRef.current?.removeEventListener('scroll', handleScroll)
    }
  }, [scrollRef.current])
  useEffect(() => {
    if (!scrollRef.current) return

    if (stickyScrolling) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [stickyScrolling, messages.length, lastMessage?.text])

  const [inputValue, setInputValue] = useState('')

  function handleInput(event: any) {
    setInputValue(event.target.value)
  }

  async function handleSubmit(message: string) {
    if (isUserWaiting) return
    // todo: handle queued messages on the backend
    onSubmit(message)
    setInputValue('')
  }

  function handleConversationSelected(agencyConversation: ?AgencyConversation) {
    onSelectConversation(agencyConversation)
    setInputValue('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const agencyVersionId =
    selectedConversation?.agencyId ?? agency?.agencyId ?? 0

  const [history] = useHistory()

  return (
    <View className={styles.chat}>
      <View ref={scrollRef} className={'messages'}>
        <View className={'top-background-cover'} />
        <View className={'top-fade'} />
        {messages.map((message) => {
          return (
            <ChatMessage
              key={message.messageId}
              className={'message-item'}
              currentUser={currentUser}
              message={message}
              agency={agency}
              isChatWithUser
              indicatorColor={'rgba(255, 255, 255, 0.5)'}
            />
          )
        })}
        {/*<PlacehoderChatMessage className={'message-item'} />*/}
        {isUserWaiting ? (
          <PlacehoderChatMessage className={'message-item'} />
        ) : null}
      </View>
      <ChatInput
        inputRef={inputRef}
        value={inputValue}
        isSubmitting={hasWriting}
        onInput={handleInput}
        onSubmit={handleSubmit}
      />
      {/*<ConversationsListPane*/}
      {/*  ref={chatListRef}*/}
      {/*  currentUser={currentUser}*/}
      {/*  agency={agency}*/}
      {/*  selectedConversation={selectedConversation}*/}
      {/*  onSelectConversation={handleConversationSelected}*/}
      {/*  agencyConversations={agencyConversations}*/}
      {/*  isLoading={isLoading}*/}
      {/*/>*/}
      {/*<View className="agency-version-wrap">*/}
      {/*  <Button className="button">*/}
      {/*    <Text>{`ID: ${agencyVersionId}`}</Text>*/}
      {/*  </Button>*/}
      {/*</View>*/}
      <Button
        className={'button settings-button'}
        onClick={() => {
          history?.push('/app/settings')
        }}
      >
        <Text>{'Settings'}</Text>
      </Button>
    </View>
  )
})

type AgentsPaneProps = {
  currentUser: User,
  agency: Agency,
  selectedConversation: ?AgencyConversation,
}

const AgentsPane: (AgentsPaneProps) => any = observer(
  (props: AgentsPaneProps): any => {
    // todo: place the ids of the agents in the collapsed AgencyCard
    const { currentUser, agency, selectedConversation } = props

    const [isMobile, setIsMobile] = useState(window.innerWidth < 600)
    useEffect(() => {
      function handleResize() {
        setIsMobile(window.innerWidth < 600)
      }

      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }, [])

    const [expanded, setExpanded] = useState(!isMobile)

    useEffect(() => {
      if (isMobile && expanded) {
        mainStore.setCloseRightSidePanel(() => {
          setExpanded(false)
        })
      } else {
        mainStore.setCloseRightSidePanel(null)
      }

      return () => {
        mainStore.setCloseRightSidePanel(null)
      }
    }, [isMobile, expanded])

    useEffect(() => {
      if (!isMobile) {
        setExpanded(true)
      }
    }, [isMobile])

    function toggleExpanded() {
      setExpanded(!expanded)
    }

    const res = useQuery(GetAgencyDetails, {
      variables: {
        sessionToken: nonMaybe(sessionStore.sessionToken),
        agencyId: selectedConversation?.agencyId ?? agency?.agencyId,
      },
    })

    const agents: Array<Agent> = res.data?.viewer?.agency?.agents ?? []

    const panelRef = useRef(null)
    const edgeRef = useRef(null)
    const [isDragging, setIsDragging] = useState(false)
    const [startDragWidth, setStartDragWidth] = useState(agentPanelDefaultWidth)
    const [startClientX, setStartClientX] = useState(0)
    const [currentClientX, setCurrentClientX] = useState(0)
    function handleDragStart(event: any) {
      const panelWidth =
        panelRef.current?.getBoundingClientRect()?.width ??
        agentPanelDefaultWidth
      setStartDragWidth(panelWidth)
      setStartClientX(event.clientX)
      setCurrentClientX(event.clientX)
      setIsDragging(true)
    }

    useEffect(() => {
      function handleDragMove(event: any) {
        if (!isDragging) {
          return
        }

        setCurrentClientX(event.clientX)
      }

      function handleDragEnd(event: any) {
        setIsDragging(false)
      }

      window.addEventListener('pointermove', handleDragMove)
      window.addEventListener('pointerup', handleDragEnd)

      return () => {
        window.removeEventListener('pointermove', handleDragMove)
        window.removeEventListener('pointerup', handleDragEnd)
      }
    }, [isDragging])

    const dragDiffX = startClientX - currentClientX

    const agentConversationMap: { [number]: AgentConversation } = {}
    for (const agentConversation of selectedConversation?.agentConversations ??
      []) {
      if (agentConversation.agentId || agentConversation.agentId === 0) {
        agentConversationMap[agentConversation.agentId] = agentConversation
      }
    }

    // console.log('isWritingMap', isWritingMap)

    return (
      <View
        ref={panelRef}
        className={styles.agents}
        style={{
          width: expanded
            ? isMobile
              ? '100%'
              : Math.max(300, Math.min(startDragWidth + dragDiffX, 600))
            : 0,
        }}
        data-is-dragging={isDragging}
      >
        <View className={'scroller'}>
          {agents.map((agent) => {
            const messages = (
              chatStore.orderedMessageIds[agent.agentId ?? 0] ?? []
            ).map((messageId) => chatStore.messages[messageId].message)
            return (
              <AgentCard
                key={agent.agentId}
                agency={agency}
                agencyId={agency.agencyId || 0}
                messages={messages}
                agent={agent}
                column={0}
                initiallyExpanded={false}
                isForReferenceOnly
                currentUser={currentUser}
              />
            )
          })}
        </View>
        {!isMobile ? (
          <View
            ref={edgeRef}
            className={styles.edge}
            data-is-dragging={isDragging}
            onPointerDown={handleDragStart}
          />
        ) : (
          <Button
            style={{
              zIndex: 1,
            }}
            className={'toggle-agent-panel-button'}
            onClick={toggleExpanded}
          >
            {!expanded ? <PiCaretLeftBold /> : <PiCaretRightBold />}
          </Button>
        )}
      </View>
    )
  },
)

type ConversationsListPaneProps = {
  currentUser: User,
  agency: Agency,
  selectedConversation: ?AgencyConversation,
  onSelectConversation: (agencyConversation: ?AgencyConversation) => any,
  agencyConversations: Array<AgencyConversation>,
  isLoading: boolean,
}

const ConversationsListPane: AbstractComponent<
  ConversationsListPaneProps,
  any,
> = forwardRef((props: ConversationsListPaneProps, ref: any) => {
  const {
    currentUser,
    agency,
    selectedConversation,
    onSelectConversation,
    agencyConversations,
    isLoading,
  } = props

  const [showMenu, setShowMenu] = useState(false)

  const chatHistoryRef = useRef(null)
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (
        chatHistoryRef.current &&
        !chatHistoryRef.current.contains(event.target)
      ) {
        setShowMenu(false)
      }
    }

    window.addEventListener('pointerdown', handleClickOutside)

    return () => {
      window.removeEventListener('pointerdown', handleClickOutside)
    }
  }, [])

  // const setRefs = (element: any) => {
  //   chatHistoryRef.current = element;
  //
  //   // Setting parentRef
  //   if (typeof ref === 'function') {
  //     ref(element);
  //   } else if (ref) {
  //     ref.current = element;
  //   }
  // };

  function handleToggleMenu() {
    setShowMenu(!showMenu)
  }

  function newChat() {
    setShowMenu(false)
    onSelectConversation(null)
  }

  function loadAgencyConversation(agencyConversation: AgencyConversation) {
    setShowMenu(false)
    onSelectConversation(agencyConversation)
    reportEvent('load conversation', {})
  }

  // Group chats in agencyConversation by agencyId:
  // Chats in agencyConversation are already sorted by ORDER BY agencyId DESC, dateCreated DESC
  const chatsGroupedByVersion: Array<Array<AgencyConversation>> = []
  let currentVersion: ?number = null
  for (const chat of agencyConversations) {
    if (chat.agencyId !== currentVersion) {
      currentVersion = chat.agencyId
      chatsGroupedByVersion.push([])
    }
    chatsGroupedByVersion[chatsGroupedByVersion.length - 1].push(chat)
  }

  return (
    <View ref={chatHistoryRef} className={styles.conversations}>
      <Button className={'button'} onClick={handleToggleMenu}>
        {isLoading ? (
          <Spinner
            buttonSpinner
            speedMultiplier={2}
            color={'rgba(0, 0, 0, 0.5)'}
            size={10}
          />
        ) : (
          <Text>
            {selectedConversation ? selectedConversation.name : 'New Chat'}
          </Text>
        )}
      </Button>
      <View className={'pane'} data-is-open={showMenu}>
        <Button onClick={newChat}>
          <Text>{'New Chat'}</Text>
          <PiPencilSimple
            style={{
              fontSize: 18,
            }}
          />
        </Button>
        {chatsGroupedByVersion.map((chatsByVersion) => {
          const sampledChat = chatsByVersion[0]
          return (
            <React.Fragment key={sampledChat?.agencyId ?? 0}>
              <View
                style={{
                  flexDirection: 'row',
                  alignSelf: 'stretch',
                  alignItems: 'center',
                  marginBottom: 10,
                  marginRight: 10,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    margin: '0 10px',
                  }}
                />
                <Text style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.2)' }}>{`${
                  sampledChat?.agencyId ?? 0
                }`}</Text>
              </View>
              {chatsByVersion.map((agencyConversation: AgencyConversation) => (
                <Button
                  key={agencyConversation.agencyConversationId}
                  onClick={() => loadAgencyConversation(agencyConversation)}
                  data-selected={
                    selectedConversation?.agencyConversationId ===
                    agencyConversation.agencyConversationId
                  }
                >
                  <Text>{agencyConversation.name}</Text>
                </Button>
              ))}
            </React.Fragment>
          )
        })}
      </View>
    </View>
  )
})

type AgencyInteractProps = {
  className: string,
  currentUser: User,
  agency: Agency,
}

const AgencyInteract: (AgencyInteractProps) => any = observer(
  (props: AgencyInteractProps) => {
    const { className, currentUser, agency } = props

    const conversationListRes = useQuery(GetAgencyConversations, {
      variables: {
        sessionToken: nonMaybe(sessionStore.sessionToken),
        agencyId: agency.agencyId,
      },
    })
    const agencyConversations =
      conversationListRes.data?.viewer?.agency?.debuggingConversations ?? []
    const selectedConversation = agencyConversations.find(
      (agencyConversation) =>
        agencyConversation.agencyConversationId === chatStore.chatId,
    )

    const [selectedConversationId, setSelectedConversationId] =
      useState<?string>(null)
    const [loadingForNameUpdate, setLoadingForNameUpdate] = useState(false)

    useEffect(() => {
      return () => {
        // onUnmount
        chatStore.newChat()
      }
    }, [])

    const isLoading = loadingForNameUpdate

    const isUserWaiting = chatStore.isUserWaiting

    function handleSelectConversation(agencyConversation: ?AgencyConversation) {
      if (selectedConversationId) {
        // If there is a conversation already openned, then when closing it,
        // set isUserWaiting to false.
        chatStore.setIsUserWaiting(false)
      }
      setSelectedConversationId(agencyConversation?.agencyConversationId)
      if (
        agencyConversation &&
        agencyConversation.agencyId &&
        agencyConversation.agencyConversationId
      ) {
        chatStore.loadChat(
          agencyConversation.agencyId,
          agencyConversation.agencyConversationId,
        )
      }
      if (!agencyConversation) {
        chatStore.newChat()
      }
    }

    async function handleSubmit(message: string) {
      if (isUserWaiting) return
      chatStore.setIsUserWaiting(true)

      if (!chatStore.chatId) {
        setLoadingForNameUpdate(true)
        const sentSuccessfully = sendNewChat(
          {
            agencyId: agency.agencyId || 0,
            userPrompt: message,
          },
          onFirstMessageComplete,
          handleNameUpdated,
        )
        if (!sentSuccessfully) {
          chatStore.setIsUserWaiting(false)
        }
      } else {
        const sentSuccessfully = sendNewMessage({
          agencyId: agency.agencyId || 0,
          chatId: chatStore.chatId,
          userPrompt: message,
        })
        if (!sentSuccessfully) {
          chatStore.setIsUserWaiting(false)
        }
      }
    }

    const chatListRef = useRef(null)

    async function onFirstMessageComplete(data: NewChatOutput) {
      await conversationListRes.refetch({
        sessionToken: nonMaybe(sessionStore.sessionToken),
        agencyId: agency.agencyId,
      })
      setSelectedConversationId(data.chatId)
      chatStore.loadChat(data.agencyId, data.chatId)
    }

    async function handleNameUpdated(data: UpdateNameOutput) {
      chatStore.updateName(data)
      await conversationListRes.refetch({
        sessionToken: nonMaybe(sessionStore.sessionToken),
        agencyId: agency.agencyId,
      })
      setLoadingForNameUpdate(false)
    }

    return (
      <View className={classnames(className, styles.container)}>
        <Chat
          currentUser={currentUser}
          agency={agency}
          onSubmit={handleSubmit}
          isUserWaiting={isUserWaiting}
          onNameUpdated={handleNameUpdated}
          chatListRef={chatListRef}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          agencyConversations={agencyConversations}
          isLoading={isLoading}
        />
        {/*<AgentsPane*/}
        {/*  currentUser={currentUser}*/}
        {/*  agency={agency}*/}
        {/*  selectedConversation={selectedConversation}*/}
        {/*/>*/}
      </View>
    )
  },
)

export default AgencyInteract
