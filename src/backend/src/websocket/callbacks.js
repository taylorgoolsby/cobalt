// @flow

import type {
  GetToListMessage,
  MessageSQL,
  ResponseMessage,
  FlatMessage,
} from '../schema/Message/MessageSchema.js'
import ID from '../utils/ID.js'
import { MessageRole, MessageType } from '../schema/Message/MessageSchema.js'

// Note: chatId is synonymous with agencyConversationId

export type NewChatInput = {
  agencyId: number,
  userPrompt: string,
  modelTitle: string,
  filterOnlyManager?: ?boolean,
}

export type NewMessageInput = {
  agencyId: number,
  chatId: string,
  userPrompt: string,
  modelTitle: string,
}

export type LoadChatInput = {
  agencyId: number,
  chatId: string,
  lastMessageIds?: { [agentId: number]: ?number },
}

export type LoadChatOutput = {
  agencyId: number,
  chatId: string,
  managerAgentId: number,
}

export type NewChatOutput = {|
  agencyId: number,
  chatId: string,
  managerAgentId: number,
|}

export type UpdateNameOutput = {|
  agencyId: number,
  chatId: string,
  managerAgentId: number,
  name: string,
|}

export type AppendMessageOutput = {|
  agencyId: number,
  chatId: string,
  managerAgentId: number,
  message: MessageSQL,
|}

export type UpdateMessageOutput = {
  agencyId: number,
  chatId: string,
  managerAgentId: number,
  message: MessageSQL,
}

type FlatAppendMessageOutput = {|
  agencyId: number,
  chatId: string,
  managerAgentId: number,
  message: FlatMessage,
|}

type FlatUpdateMessageOutput = {
  agencyId: number,
  chatId: string,
  managerAgentId: number,
  message: FlatMessage,
}

export type Callbacks = {
  loadChat: (output: LoadChatOutput) => any,
  newChat: (output: NewChatOutput) => any,
  updateName: (output: UpdateNameOutput) => any,
  appendMessage: (output: AppendMessageOutput) => any,
  updateMessage: (output: UpdateMessageOutput) => any,
  error: (err: Error) => any,
  stoppedIterating: () => any,
}

const SSEConnectionRegistry: {
  [agencyConversationId: string]: { [connectionId: string]: any },
} = {}
const socketRegistry: { [userId: string]: { [socketId: string]: any } } = {}

// Each time a new chat is created, we store the output here to avoid race conditions.
export const updateNameEvents: {
  [agencyConversationId: string]: UpdateNameOutput,
} = {}

// Each SSE connection is for listening to a single conversation:
export function registerSSE(agencyConversationId: string, res: any): string {
  if (!SSEConnectionRegistry[agencyConversationId]) {
    SSEConnectionRegistry[agencyConversationId] = {}
  }

  const connectionId = `${ID.getUnique()}${ID.getRandom()}`
  SSEConnectionRegistry[agencyConversationId][connectionId] = res
  res.on('close', () => {
    res.end()
    delete SSEConnectionRegistry[agencyConversationId][connectionId]
    if (Object.keys(SSEConnectionRegistry[agencyConversationId]).length === 0) {
      delete SSEConnectionRegistry[agencyConversationId]
    }
  })

  let stopped = false
  let timeout
  function startInactivityTimeout() {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    timeout = setTimeout(() => {
      if (stopped) return
      stopped = true
      console.debug('Timeout due to chat activity.')
      res.write(`data: [DONE]`)
      res.end()
    }, 30000) // 30 seconds
  }
  startInactivityTimeout()

  const originalWrite = res.write
  res.write = function (...args) {
    try {
      startInactivityTimeout()
      originalWrite.apply(res, args)
    } catch (e) {
      console.error(e)
    }
  }
  return connectionId
}

// Each websocket connection is for listening to all conversations under all agencies a user is part of:
export function registerWebSocket(userId: string, socket: any) {
  if (!socketRegistry[userId]) {
    socketRegistry[userId] = {}
  }

  const socketId = `${ID.getUnique()}${ID.getRandom()}`
  socketRegistry[userId][socketId] = socket
  socket.on('disconnect', () => {
    delete socketRegistry[userId][socketId]
    if (Object.keys(socketRegistry[userId]).length === 0) {
      delete socketRegistry[userId]
    }
  })
}

// These callbacks have closures around global state variables
// which hold connections to SSE, websocket, or webhook.
// So asynchronous calls to these callbacks will send
// the output through all registered channels.
export async function getCallbacks(
  userId: string,
  agencyConversationId: string,
): Promise<Callbacks> {
  // AgentMind should timeout after 10 seconds of inactivity.
  // This kills all connections for the given conversation.
  let stopped = false
  const stoppedIterating = () => {
    stopped = true

    console.debug('stopped iterating')

    const connections: Array<any> = Object.values(
      SSEConnectionRegistry[agencyConversationId] || {},
    )
    for (const res of connections) {
      if (res && !res.writableEnded) {
        res.write(`data: [DONE]`)
        res.end()
      }
    }
  }

  return {
    loadChat: (output: LoadChatOutput) => {
      console.debug('loadChat')
      // console.debug('loadChat', output)

      const sockets: Array<any> = Object.values(socketRegistry[userId] || {})
      for (const socket of sockets) {
        // todo: potentially big array if many users are sharing a public access key.
        if (socket?.connected) {
          if (socket.custom.listenToEverything) {
            socket.emit('loadChat', output)
          } else if (
            socket.custom.listenToAgencyId === output.agencyId &&
            socket.custom.listenToChatId === output.chatId
          ) {
            socket.emit('loadChat', output)
          } else {
            // Skip over this socket as it is not allowed to receive this message.
          }
        }
      }

      const connections: Array<any> = Object.values(
        SSEConnectionRegistry[agencyConversationId] || {},
      )
      for (const res of connections) {
        if (res && !res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({
              type: 'loadChat',
              output,
            })}\n\n`,
          )
        }
      }
    },
    newChat: (output: NewChatOutput) => {
      // console.debug('newChat')
      console.debug('newChat', output)

      const sockets: Array<any> = Object.values(socketRegistry[userId] || {})
      for (const socket of sockets) {
        // todo: potentially big array if many users are sharing a public access key.
        if (socket?.connected) {
          if (socket.custom.listenToEverything) {
            socket.emit('newChat', output)
          } else if (socket.custom.listenToAgencyId === output.agencyId) {
            socket.custom.listenToChatId = output.chatId
            socket.emit('newChat', output)
          } else {
            // Skip over this socket as it is not allowed to receive this message.
          }
        }
      }

      const connections: Array<any> = Object.values(
        SSEConnectionRegistry[agencyConversationId] || {},
      )
      for (const res of connections) {
        if (res && !res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({
              type: 'newChat',
              output,
            })}\n\n`,
          )
        }
      }
    },
    updateName: (output: UpdateNameOutput) => {
      console.debug('updateName')
      // console.debug('updateName', output)

      updateNameEvents[output.chatId] = output

      const sockets: Array<any> = Object.values(socketRegistry[userId] || {})
      for (const socket of sockets) {
        // todo: potentially big array if many users are sharing a public access key.
        if (socket?.connected) {
          if (socket.custom.listenToEverything) {
            socket.emit('updateName', output)
          } else if (
            socket.custom.listenToAgencyId === output.agencyId &&
            socket.custom.listenToChatId === output.chatId
          ) {
            socket.emit('updateName', output)
          } else {
            // Skip over this socket as it is not allowed to receive this message.
          }
        }
      }

      const connections: Array<any> = Object.values(
        SSEConnectionRegistry[agencyConversationId] || {},
      )
      for (const res of connections) {
        if (res && !res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({
              type: 'updateName',
              output,
            })}\n\n`,
          )
        }
      }
    },
    appendMessage: (output: AppendMessageOutput) => {
      // console.debug('appendMessage')

      if (output.message.role === MessageRole.SYSTEM) {
        console.error('Attempted to emit SYSTEM message to client.')
        return
      }

      // console.debug('appendMessage', output)

      const subOutputs: Array<FlatAppendMessageOutput> = []

      // const parsedText = JSON.parse(output.message.data.text)
      // if (parsedText.type === MessageType.GetToList) {
      //   // A GetToList message is a simple /chat/completions call which may contain multiple responses from other agents.
      //   // Before delivering to the client, we will split these up into individual messages.
      //   const getToListMessage: GetToListMessage = parsedText
      //   for (const subMessage of getToListMessage.messages) {
      //     const subOutput: FlatAppendMessageOutput = {
      //       ...output,
      //       message: {
      //         ...output.message,
      //         ...output.message.data,
      //         fromAgentId: subMessage.from,
      //         fromApi: subMessage.from === null,
      //         text: subMessage.text,
      //       },
      //     }
      //     delete subOutput.message.data
      //     subOutputs.push(subOutput)
      //   }
      // } else if (parsedText.type === MessageType.Response) {
      //   const responseMessage: ResponseMessage = parsedText
      //   const subOutput: FlatAppendMessageOutput = {
      //     ...output,
      //     message: {
      //       ...output.message,
      //       ...output.message.data,
      //       text: responseMessage.text,
      //     },
      //   }
      //   delete subOutput.message.data
      //   subOutputs.push(subOutput)
      // } else {
      //   console.error(`Unexpected message type: ${parsedText.type}`)
      //   return
      // }
      const subOutput: FlatAppendMessageOutput = {
        ...output,
        message: {
          ...output.message,
          ...output.message.data,
        },
      }
      delete subOutput.message.data
      subOutputs.push(subOutput)

      for (const subOutput of subOutputs) {
        const sockets: Array<any> = Object.values(socketRegistry[userId] || {})
        for (const socket of sockets) {
          // todo: potentially big array if many users are sharing a public access key.
          if (socket?.connected) {
            if (socket.custom.filterOnlyManager) {
              const allowed =
                output.managerAgentId === subOutput.message.agentId &&
                (subOutput.message.fromApi || subOutput.message.toApi)
              if (!allowed) {
                continue
              }
            }

            if (socket.custom.listenToEverything) {
              socket.emit('appendMessage', subOutput)
            } else if (
              socket.custom.listenToAgencyId === subOutput.agencyId &&
              socket.custom.listenToChatId === subOutput.chatId
            ) {
              socket.emit('appendMessage', subOutput)
            } else {
              // Skip over this socket as it is not allowed to receive this message.
            }
          }
        }

        const connections: Array<any> = Object.values(
          SSEConnectionRegistry[agencyConversationId] || {},
        )
        for (const res of connections) {
          if (res && !res.writableEnded) {
            res.write(
              `data: ${JSON.stringify({
                type: 'appendMessage',
                subOutput,
              })}\n\n`,
            )
          }
        }
      }
    },
    updateMessage: (output: UpdateMessageOutput) => {
      // console.debug('updateMessage')
      // console.debug('updateMessage', output)

      if (output.message.role === MessageRole.SYSTEM) {
        console.error('Attempted to emit SYSTEM message to client.')
        return
      }

      const subOutputs: Array<FlatUpdateMessageOutput> = []

      // const parsedText = JSON.parse(output.message.data.text)
      // if (parsedText.type === MessageType.GetToList) {
      //   // A GetToList message is a simple /chat/completions call which may contain multiple responses from other agents.
      //   // Before delivering to the client, we will split these up into individual messages.
      //   const getToListMessage: GetToListMessage = parsedText
      //   for (const subMessage of getToListMessage.messages) {
      //     const subOutput: FlatUpdateMessageOutput = {
      //       ...output,
      //       message: {
      //         ...output.message,
      //         ...output.message.data,
      //         fromAgentId: subMessage.from,
      //         fromApi: subMessage.from === null,
      //         text: subMessage.text,
      //       },
      //     }
      //     delete subOutput.message.data
      //     subOutputs.push(subOutput)
      //   }
      // } else if (parsedText.type === MessageType.Response) {
      //   const responseMessage: ResponseMessage = parsedText
      //   const subOutput: FlatUpdateMessageOutput = {
      //     ...output,
      //     message: {
      //       ...output.message,
      //       ...output.message.data,
      //       text: responseMessage.text,
      //     },
      //   }
      //   delete subOutput.message.data
      //   subOutputs.push(subOutput)
      // } else {
      //   console.error(`Unexpected message type: ${parsedText.type}`)
      //   return
      // }
      const subOutput: FlatUpdateMessageOutput = {
        ...output,
        message: {
          ...output.message,
          ...output.message.data,
        },
      }
      delete subOutput.message.data
      subOutputs.push(subOutput)

      for (const subOutput of subOutputs) {
        const sockets: Array<any> = Object.values(socketRegistry[userId] || {})
        for (const socket of sockets) {
          // todo: potentially big array if many users are sharing a public access key.
          if (socket?.connected) {
            if (socket.custom.filterOnlyManager) {
              const allowed =
                output.managerAgentId === subOutput.message.agentId &&
                (subOutput.message.fromApi || subOutput.message.toApi)
              if (!allowed) {
                continue
              }
            }

            if (socket.custom.listenToEverything) {
              socket.emit('updateMessage', subOutput)
            } else if (
              socket.custom.listenToAgencyId === subOutput.agencyId &&
              socket.custom.listenToChatId === subOutput.chatId
            ) {
              socket.emit('updateMessage', subOutput)
            } else {
              // Skip over this socket as it is not allowed to receive this message.
            }
          }
        }

        const connections: Array<any> = Object.values(
          SSEConnectionRegistry[agencyConversationId] || {},
        )
        for (const res of connections) {
          if (res && !res.writableEnded) {
            res.write(
              `data: ${JSON.stringify({
                type: 'updateMessage',
                subOutput,
              })}\n\n`,
            )
          }
        }
      }
    },
    error: (err: Error) => {
      console.error(err)

      const sockets: Array<any> = Object.values(socketRegistry[userId] || {})
      for (const socket of sockets) {
        // todo: potentially big array if many users are sharing a public access key.
        if (socket?.connected) {
          socket.emit('error', { message: err.message })
        }
      }

      const connections: Array<any> = Object.values(
        SSEConnectionRegistry[agencyConversationId] || {},
      )
      for (const res of connections) {
        if (res && !res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({
              type: 'error',
              output: { message: err.message },
            })}\n\n`,
          )
        }
      }
    },
    stoppedIterating,
  }
}
