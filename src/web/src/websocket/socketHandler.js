// @flow

import { io } from 'socket.io-client'
import Config from '../Config.js'
import type { FlatMessage, Message } from '../types/Message.js'
import { showErrorModal } from '../modals/ErrorModal.js'
import debounce from 'lodash.debounce'

let socket: any
let reconnectTimeout: any

export type NewChatInput = {
  agencyId: number,
  userPrompt: string,
  filterOnlyManager?: ?boolean,
}

export type NewChatOutput = {
  agencyId: number,
  chatId: string,
  managerAgentId: number,
}

export type NewMessageInput = {
  agencyId: number,
  chatId: string,
  userPrompt: string,
}

export type LoadChatInput = {
  agencyId: number,
  chatId: string,
  lastMessageIds?: { [agentId: number]: number },
}

export type LoadChatOutput = {
  agencyId: number,
  chatId: string,
  managerAgentId: number,
}

export type UpdateNameOutput = {
  agencyId: number,
  chatId: string,
  managerAgentId: number,
  name: string,
}

export type AppendMessageOutput = {
  agencyId: number,
  chatId: string,
  managerAgentId: number,
  message: FlatMessage,
}

export type UpdateMessageOutput = {
  agencyId: number,
  chatId: string,
  managerAgentId: number,
  message: FlatMessage,
}

let onLoadChat: ?(output: LoadChatOutput) => any = null
let onNewChat: ?(output: NewChatOutput) => any = null
let onUpdateName: ?(output: UpdateNameOutput) => any = null
let onAppendMessage: ?(output: AppendMessageOutput) => any = null
let onUpdateMessage: ?(output: UpdateMessageOutput) => any = null
let debouncedOnUpdateMessage: ?(output: UpdateMessageOutput) => any = null
let onReconnect: ?() => any = null

export function disconnect() {
  if (socket?.connected) {
    socket.disconnect()
    socket = null
  }
}

export function sendLoadChat(
  input: LoadChatInput,
  callback: (output: LoadChatOutput) => any,
) {
  onLoadChat = callback
  if (socket?.connected) {
    console.debug('loadChat', input)
    socket.emit('loadChat', input)
  } else {
    showErrorModal('Unable to connect to server. Please try again later.')
  }
}

export function sendNewChat(
  input: NewChatInput,
  newChatCallback: (output: NewChatOutput) => any,
  updateNameCallback: (output: UpdateNameOutput) => any,
): boolean {
  onNewChat = newChatCallback
  onUpdateName = updateNameCallback
  if (socket?.connected) {
    console.debug('newChat', input)
    socket.emit('newChat', input)
    return true
  } else {
    showErrorModal('Unable to connect to server. Please try again later.')
    return false
  }
}

export function sendNewMessage(input: NewMessageInput): boolean {
  if (socket?.connected) {
    socket.emit('newMessage', input)
    return true
  } else {
    showErrorModal('Unable to connect to server. Please try again later.')
    return false
  }
}

export function setAppendMessageCallback(
  callback: ?(output: AppendMessageOutput) => any,
) {
  onAppendMessage = callback
}

export function setUpdateMessageCallback(
  callback: ?(output: UpdateMessageOutput) => any,
) {
  onUpdateMessage = callback

  // This debounced callback is used for a race condition which causes a bug when token updates stop.
  // It seems that it is possible for onUpdateMessage to be called during a react rerender,
  // which queues useEffect with an old value for UpdateMessageOutput,
  // yet onUpdateMessage has already called setUpdateMessageCallback with the new value.
  // The useEffect runs on the old value, so the new value is lost.
  if (callback) {
    debouncedOnUpdateMessage = debounce(callback, 3000)
  } else {
    // $FlowFixMe
    debouncedOnUpdateMessage?.cancel()
    debouncedOnUpdateMessage = null
  }
}

export function setReconnectCallback(callback: ?() => any) {
  onReconnect = callback
}

export function establishSocket(sessionToken: string): void {
  if (!sessionToken) return
  console.log('establishSocket')
  if (socket) {
    // In case hot reloading attempts to connect multiple times, don't.
    // Reconnection will set socket to null.
    return
  }

  socket = io(Config.backendHost, {
    query: {
      sessionToken,
    },
    reconnection: false, // Enable reconnection
    reconnectionAttempts: Infinity, // Number of reconnection attempts
    reconnectionDelay: 1000, // Delay between reconnection attempts
    reconnectionDelayMax: 5000, // Maximum delay between reconnection attempts
    randomizationFactor: 0.5,
  })

  socket.on('connect_error', (error) => {
    console.debug('connect_error')
    socket = null
    reconnectTimeout = setTimeout(() => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
      establishSocket(sessionToken)
    }, 5000 * (Math.random() + 0.5))
  })

  socket.on('disconnect', () => {
    console.debug('disconnected')
    socket = null
    reconnectTimeout = setTimeout(() => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
        reconnectTimeout = null
      }
      establishSocket(sessionToken)
    }, 5000 * (Math.random() + 0.5))
  })

  socket.on('connect', () => {
    if (!socket) return
    console.debug('connected') // x8WIv7-mJelg7on_ALbx

    if (onReconnect) {
      onReconnect()
    }

    socket.on('loadChat', (output: LoadChatOutput) => {
      console.debug('loadChat', output)
      if (onLoadChat) {
        onLoadChat(output)
      }
    })

    socket.on('newChat', (output: NewChatOutput) => {
      console.debug('newChat', output)
      if (onNewChat) {
        onNewChat(output)
      }
    })

    socket.on('updateName', (output: UpdateNameOutput) => {
      console.debug('updateName', output)
      if (onUpdateName) {
        onUpdateName(output)
      }
    })

    socket.on('appendMessage', (output: AppendMessageOutput) => {
      console.debug('appendMessage', output)
      if (onAppendMessage) {
        onAppendMessage(output)
      }
    })

    socket.on('updateMessage', (output: UpdateMessageOutput) => {
      // console.debug('updateMessage', output)
      if (onUpdateMessage) {
        onUpdateMessage(output)
      }
      if (debouncedOnUpdateMessage) {
        debouncedOnUpdateMessage(output)
      }
    })
  })
}
