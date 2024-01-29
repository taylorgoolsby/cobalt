// @flow

import { makeObservable, observable, action, toJS } from 'mobx'
import { apolloCache } from '../apolloClient.js'
import nonMaybe from 'non-maybe'
import type {
  AppendMessageOutput,
  LoadChatOutput,
  UpdateMessageOutput,
  UpdateNameOutput,
} from '../websocket/socketHandler.js'
import mainStore from './MainStore.js'
import type { FlatMessage } from '../types/Message.js'
import {
  sendLoadChat,
  setAppendMessageCallback,
  setReconnectCallback,
  setUpdateMessageCallback,
} from '../websocket/socketHandler.js'

class ChatStore {
  @observable loaded: boolean = false
  @observable loading: boolean = false
  // @observable chatRes: ?ChatRes = null
  @observable isUserWaiting: boolean = false
  // @observable selectedConversationId: ?string = null

  @observable agencyId: ?number
  @observable chatId: ?string
  @observable managerAgentId: ?number
  // These are used for rendering order:
  @observable orderedMessageIds: {
    [agentId: number]: Array<number>,
  } = {}
  // Theses messages maps are used for the 'click to navigate' feature.
  @observable messages: {
    [messageId: number]: {
      message: FlatMessage,
      ref?: any,
      scrollTo?: ?() => any,
    },
  } = {}
  @observable mainChatMessages: {
    [messageId: number]: {
      message: FlatMessage,
      ref?: any,
      scrollTo?: ?() => any,
    },
  } = {}

  constructor() {
    makeObservable(this)
  }

  @action registerMessage(messageId: ?number, ref: any, scrollTo: () => any) {
    if (!messageId) return
    if (!this.messages[messageId]) return

    this.messages[messageId].ref = ref
    this.messages[messageId].scrollTo = scrollTo
  }

  @action unregisterMessage(messageId: ?number) {
    if (!messageId) return
    if (!this.messages[messageId]) return

    this.messages[messageId].ref = null
    this.messages[messageId].scrollTo = null
  }

  @action registerMainChatMessage(
    messageId: ?number,
    ref: any,
    scrollTo: () => any,
  ) {
    if (!messageId) return
    if (!this.mainChatMessages[messageId]) return

    this.mainChatMessages[messageId].ref = ref
    this.mainChatMessages[messageId].scrollTo = scrollTo
  }

  @action unregisterMainChatMessage(messageId: ?number) {
    if (!messageId) return
    if (!this.mainChatMessages[messageId]) return

    this.mainChatMessages[messageId].ref = null
    this.mainChatMessages[messageId].scrollTo = null
  }

  @action setIsUserWaiting(value: boolean) {
    this.isUserWaiting = value
  }

  @action newChat() {
    this.agencyId = null
    this.chatId = null
    this.managerAgentId = null
    this.orderedMessageIds = {}
    this.messages = {}
    this.mainChatMessages = {}
    this.loaded = true
    this.loading = false
    setReconnectCallback(null)
    setAppendMessageCallback(null)
    setUpdateMessageCallback(null)
  }

  @action openAgentCard(agentId: number) {
    const agentCard = mainStore.registeredCards[0]?.[agentId]
    if (agentCard) {
      agentCard.open()
    }
  }

  @action loadChat(agencyId: number, agencyConversationId: string) {
    this.agencyId = agencyId
    this.chatId = agencyConversationId
    this.managerAgentId = null
    this.orderedMessageIds = {}
    this.messages = {}
    this.mainChatMessages = {}
    this.loaded = false
    this.loading = true
    sendLoadChat(
      {
        agencyId: agencyId,
        chatId: agencyConversationId,
        lastMessageIds: {},
      },
      (output: LoadChatOutput) => {
        if (
          this.chatId === output.chatId &&
          this.chatId === agencyConversationId
        ) {
          // Same chat is still loaded.
          this.loaded = true
          this.loading = false
        }
      },
    )
    setReconnectCallback(() => {
      const lastMessageIds: { [number]: number } = {}
      for (const agentId of Object.keys(this.orderedMessageIds)) {
        const messageIds = this.orderedMessageIds[parseInt(agentId)]
        if (messageIds.length) {
          lastMessageIds[parseInt(agentId)] = messageIds[messageIds.length - 1]
        }
      }
      sendLoadChat(
        {
          agencyId: agencyId,
          chatId: agencyConversationId,
          lastMessageIds,
        },
        (output: LoadChatOutput) => {
          if (
            this.chatId === output.chatId &&
            this.chatId === agencyConversationId
          ) {
            // Same chat is still loaded.
            this.loaded = true
            this.loading = false
          }
        },
      )
    })
    setAppendMessageCallback((data: AppendMessageOutput) => {
      chatStore.appendMessage(data)
    })
    setUpdateMessageCallback((data: UpdateMessageOutput) => {
      chatStore.updateMessage(data)
    })
  }

  @action updateName(data: UpdateNameOutput) {
    if (!this.chatId) return

    this.managerAgentId = data.managerAgentId

    apolloCache.modify({
      id: this.chatId,
      fields: {
        name() {
          return data.name
        },
      },
    })
  }

  @action appendMessage(data: AppendMessageOutput) {
    if (!this.chatId) return

    if (this.agencyId !== data.agencyId) {
      console.error('appendMessage: agencyId mismatch')
      return
    }

    this.managerAgentId = data.managerAgentId

    // Update messages mappings:
    if (data.message.messageId) {
      if (this.messages[data.message.messageId]) {
        this.messages[data.message.messageId].message = data.message
      } else {
        this.messages[data.message.messageId] = { message: data.message }
      }

      if (data.message.fromApi || data.message.toApi) {
        if (this.mainChatMessages[data.message.messageId]) {
          this.mainChatMessages[data.message.messageId].message = data.message
        } else {
          this.mainChatMessages[data.message.messageId] = {
            message: data.message,
          }
        }
      }
    }

    // When starting a new chat in the main chat panel,
    // a typing indicator is shown until the first toApi message is received.
    const isToMainChat =
      data.managerAgentId === data.message.agentId && !!data.message.toApi
    if (isToMainChat) {
      this.setIsUserWaiting(false)
    }

    const prevMessageIds = this.orderedMessageIds[data.message.agentId] ?? []
    const nextMessageIds = [...prevMessageIds]
    let alreadyAdded = false
    const insertIndex = nextMessageIds.findIndex((messageId) => {
      // Iterate through messages, ascending, and stopping when we reach the first message which comes
      // after the new message.
      // If we see the new message already added, do nothing,
      // otherwise, insert the new message at the correct position.
      if (messageId === data.message.messageId) {
        alreadyAdded = true
      }
      return nonMaybe(data.message.messageId) < nonMaybe(messageId)
    })
    if (!alreadyAdded) {
      if (insertIndex === -1) {
        // All messages come before the new message, so add it to the end.
        nextMessageIds.push(data.message.messageId)
      } else {
        nextMessageIds.splice(insertIndex, 0, data.message.messageId)
      }
    }
    if (!alreadyAdded) {
      this.orderedMessageIds[data.message.agentId] = nextMessageIds
      this.openAgentCard(data.message.agentId)
    } else {
      console.error('already appended', data)
    }
  }

  @action updateMessage(data: UpdateMessageOutput) {
    if (!this.chatId) return

    if (this.agencyId !== data.agencyId) {
      console.error('updateMessage: agencyId mismatch')
      return
    }

    this.managerAgentId = data.managerAgentId

    // Update messages mappings:
    if (data.message.messageId) {
      if (this.messages[data.message.messageId]) {
        this.messages[data.message.messageId].message = data.message
      } else {
        this.messages[data.message.messageId] = { message: data.message }
      }

      if (data.message.fromApi || data.message.toApi) {
        if (this.mainChatMessages[data.message.messageId]) {
          this.mainChatMessages[data.message.messageId].message = data.message
        } else {
          this.mainChatMessages[data.message.messageId] = {
            message: data.message,
          }
        }
      }
    }

    this.openAgentCard(data.message.agentId)
  }
}

const chatStore: ChatStore = new ChatStore()

export default chatStore
