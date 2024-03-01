// @flow

import http from 'http'
import { Server } from 'socket.io'
import createViewer from '../utils/createViewer.js'
import type { SessionToken } from '../utils/Token.js'
import UserInterface from '../schema/User/UserInterface.js'
import type {
  NewChatInput,
  NewMessageInput,
  LoadChatInput,
} from './callbacks.js'
import { getCallbacks, registerWebSocket } from './callbacks.js'
import newChatHandler from './newChatHandler.js'
import newMessageHandler from './newMessageHandler.js'
import loadChatHandler from './loadChatHandler.js'
import type { UserSQL } from '../schema/User/UserSchema.js'
import nonMaybe from 'non-maybe'
import type { AgencySQL } from '../schema/Agency/AgencySchema.js'
import { unpackDemoSessionToken } from '../utils/Token.js'
import AgencyInterface from '../schema/Agency/AgencyInterface.js'
import AuthTokenInterface from '../schema/AuthToken/AuthTokenInterface.js'
import Config from 'common/src/Config.js'

// This is a stateful websocket server.
// const sockets: { [userId: string]: any } = {}

/*
  todo: Consider refactor of Database structure around messages.
    Since it is possible for a single POST to the agent to contain multiple messages from different agents,
    and also since it is possible for messages to be linked together,
    it may be better to break the Message table into two tables: Message and Completion.
    For example, let's suppose the agent we want to send to have received two messages from two other agents during this event loop.
    We would want to compile those two messages into a single completion call.
    Furthermore, we want the agent to be able to reply to multiple agents within one chat iteration.
    So there is one chat iteration, but mutiple completions.
    A chat iteration is a construct used for the backend,
    but on the front end, we want to display the messages, which are the inputs and outputs to a chat iteration.

  todo: We have the need to stream data from multiple agents at once.
    Since agency conversations are long running processes,
    when a chat loads, let's assume there are ongoing conversations among agents.
    The loadChat event must load all of the existing messages, and begin streaming token updates for each agent's conversation.
    For now, we will only have a single monolithic server, so we can use websockets easily.
    The socket is established when the user logs in, and is held open for the duration of their session.

  So let's recap the page load:
    - A websocket connection is established.
    - Apollo is used for GraphQL.
    - When a new chat begins, agencyId, the message, and conversationId=null is sent via websocket.
    - When an existing conversation loads, the conversationId, the last messageId, and the contents of the last message are sent.
    - For a new chat, the server will create a new conversationId, and send it back to the client as one chunk.
    - For an existing chat, the server will figure out which information the client is missing, and send it back as one chunk.
      - This is also what happens on reconnection.
    - Now the server knows which conversationId the client is interested in, and that it is up to date.
    - When the client is up-to-date on a certain chat, the server will send streaming data for that chat.
    - When the server receives streaming data from openai for a chat that is not opened, it will not send it.

  And recap of API usage:
    - API usage uses SSE rather than websocket. The setup is simpler because only messages from the agency as a whole need to be sent.
    - There is an endpoing to being a new chat, which opens an SSE channel.
    - Unlike openai, there is no way to change message history.
      - This is reduces use cases to ones where the client sends an initial prompt only, and rarely subsequent messages.
      - Agencies are long running processes with many internal conversations happening, so it's not possible to change message history.
    - There is an endpoint to append a new message to an existing chat.
      - If the client makes a mistake, they can start a new chat, or a new message telling the agency what the correction is.


  Details of websocket handler:
    - Incoming Chunk types:
      - New Chat (agencyId, message)
      - Load Chat (agencyConversationId, lastMessageId)
        - Sent after graphql loads chat, or on reconnect.
        - Race condition is avoided because the server only starts sending tokens after Load Chat succeeds.
    - Outgoing Chunk types:
      - New Chat (agencyId, agencyConversationId)
      - Update Name (agencyId, agencyConversationId, name)
      - Append Message (agencyId, agencyConversationId, agentConversationId, messageId, previousMessageId, messageData)
        - Send after New Chat or Load Chat to populate client with missing messages.
        - Client uses previousMessageId to verify. On error, loading process restarts using Load Chat.
          - If lastMessageId=previousMessageId, append.
          - Else, abort and resend Load Chat.
          - This makes it impossible for a race condition to cause incorrect message order.
      - Update Message (agencyId, agencyConversationId, agentConversationId, messageId, message)
        - Sent after all Append Message chunks are sent.
        - Secondly, race condition is avoided here because the server sends the entire message text to update.
        - The client uses graphql client-side cache update to update the message.

  Websocket communication flows:
    - New Chat (from client) -> New Chat (from server) -> Append Message -> Update Message
    - Load Chat -> Append Message -> Update Message

* */

export default function setupWebsockets(app: any): any {
  const server = http.createServer(app)
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  })

  io.on('connection', async (socket) => {
    console.debug('websocket connected')
    socket.on('disconnect', () => {
      console.debug('websocket disconnected')
    })

    try {
      // Authentication:
      let listenToEverything = false
      let listenToAgency: ?AgencySQL
      let user: ?UserSQL
      if (socket.handshake.query.sessionToken) {
        const sessionToken = socket.handshake.query.sessionToken
        const session: SessionToken = await createViewer(sessionToken, {})
        user = await UserInterface.getUser(session.userId)
        listenToEverything = true
      } else if (socket.handshake.query.demoSessionToken) {
        throw new Error('demoSessionToken is no longer supported')
        // const agencyId = parseInt(socket.handshake.query.agencyId)
        // if (!agencyId) {
        //   throw new Error(
        //     'You must specify which agencyId you want to listen to.',
        //   )
        // }
        // const demoSessionToken = socket.handshake.query.demoSessionToken
        // const session = await unpackDemoSessionToken(demoSessionToken)
        // if (session.demoAgencyId !== agencyId) {
        //   throw new Error('Unauthorized')
        // }
        // user = await UserInterface.getUser(session.userId)
        // listenToAgency = await AgencyInterface.getOwned(
        //   session.demoAgencyId,
        //   session.userId,
        // )
      } else if (socket.handshake.query.accessKey) {
        throw new Error('accessKey is no longer supported')
        // const agencyId = socket.handshake.query.agencyId
        // if (!agencyId) {
        //   throw new Error(
        //     'You must specify which agencyId you want to listen to.',
        //   )
        // }
        //
        // const authKey = await AuthTokenInterface.getByToken(
        //   socket.handshake.query.accessKey,
        // )
        // if (!authKey) {
        //   throw new Error('Unauthorized')
        // }
        // const agencyVersions = await AgencyInterface.getActiveVersions(
        //   authKey.agencyVersionId,
        // )
        // // This verifies the agency version associated with the auth token contains the agency id.
        // listenToAgency = agencyVersions.find(
        //   (agency) => agency.agencyId === agencyId,
        // )
        // if (!listenToAgency) {
        //   throw new Error('Unauthorized')
        // }
        // user = await UserInterface.getUser(listenToAgency?.userId)
        //
        // const isTrialKey = user?.openAiKey === Config.openAiPublicTrialKey
        // if (isTrialKey) {
        //   throw new Error(
        //     'When using the trial key, you cannot use the publish API with permanent keys.',
        //   )
        // }
      } else {
        throw new Error('Unauthorized')
      }

      if (!user) {
        throw new Error('Unauthorized')
      }

      if (!listenToEverything && !listenToAgency) {
        throw new Error('Unauthorized')
      }

      // const openAiKey = user?.openAiKey
      // if (!openAiKey) {
      //   throw new Error('Unauthorized')
      // }
      const apiBase = user?.inferenceServerConfig?.apiBase
      if (!apiBase) {
        throw new Error('Unauthorized')
      }
      const apiKey = user?.inferenceServerConfig?.apiKey
      const isOpenAi =
        user?.inferenceServerConfig?.apiBase === 'https://api.openai.com'
      if (isOpenAi) {
        if (!apiKey) {
          throw new Error('Unauthorized')
        }
      }

      socket.custom = {
        listenToEverything: listenToEverything,
        listenToAgencyId: listenToAgency?.agencyId,
        listenToChatId: null,
        filterOnlyManager: false,
      }

      registerWebSocket(user.userId, socket)

      // Only sockets created using sessionToken are able to listen to all messages for all conversations.
      // Sockets created using demoSessionToken or accessKey are only able to send newChat if a chatId has not yet
      // been established. Once a chatId is established, only messages for that chat are sent.
      // If the client resends newChat, the new chatId is used.

      socket.on('newChat', async (data: NewChatInput) => {
        if (!listenToEverything) {
          if (data.agencyId !== listenToAgency?.agencyId) {
            socket.emit('error', { message: 'Unauthorized agencyId' })
            socket.disconnect()
            return
          }
        }

        if (data.filterOnlyManager) {
          socket.custom.filterOnlyManager = data.filterOnlyManager
        }

        // This call will eventually set socket.custom.listenToChatId to the new chatId:
        try {
          await newChatHandler(nonMaybe(user), data)
        } catch (err) {
          socket.emit('error', { message: err.message })
          console.error(err)
        }
      })

      socket.on('newMessage', async (data: NewMessageInput) => {
        if (!listenToEverything) {
          if (data.agencyId !== listenToAgency?.agencyId) {
            socket.emit('error', { message: 'Unauthorized agencyId' })
            socket.disconnect()
            return
          }
          if (!socket.custom.listenToChatId) {
            socket.emit('error', {
              message:
                'A chatId has not been established for this socket. You must first send newChat.',
            })
            socket.disconnect()
            return
          }
          if (socket.custom.listenToChatId !== data.chatId) {
            socket.emit('error', {
              message:
                'You cannot send a message to specified chatId because a different chatId is current associated with this connection. Please change the chatId by sending loadChat, or start a new chat using newChat.',
            })
            socket.disconnect()
            return
          }
        }

        try {
          await newMessageHandler(nonMaybe(user), data)
        } catch (err) {
          socket.emit('error', { message: err.message })
          console.error(err)
        }
      })

      socket.on('loadChat', async (data: LoadChatInput) => {
        if (!listenToEverything) {
          // set the new chatId:
          if (data.agencyId !== listenToAgency?.agencyId) {
            socket.emit('error', { message: 'Unauthorized agencyId' })
            socket.disconnect()
            return
          }
          socket.custom.listenToChatId = data.chatId
        }

        try {
          // This call will start sending appendMessage and updateMessage for the data.chatId,
          // so it is imporant that the new chatId is set on socket.custom.listenToChatId before this call.
          await loadChatHandler(nonMaybe(user), data)
        } catch (err) {
          socket.emit('error', { message: err.message })
          console.error(err)
        }
      })
    } catch (err) {
      console.error(err)
      console.debug('intentional disconnect')
      if (socket.connected) {
        socket.emit('error', { message: err.message })
      }
      socket.disconnect()
    }
  })

  return server
}
