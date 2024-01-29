// @flow

import type { ApiGroup } from '../apiTypes.js'
import type { AgencySQL } from '../../schema/Agency/AgencySchema.js'
import type {
  LoadChatInput,
  NewChatInput,
  NewMessageInput,
  UpdateNameOutput,
} from '../../websocket/callbacks.js'
import {
  getCallbacks,
  registerSSE,
  updateNameEvents,
} from '../../websocket/callbacks.js'
import newChatHandler from '../../websocket/newChatHandler.js'
import UserInterface from '../../schema/User/UserInterface.js'
import newMessageHandler from '../../websocket/newMessageHandler.js'
import loadChatHandler from '../../websocket/loadChatHandler.js'
import AgencyConversationInterface from '../../schema/AgencyConversation/AgencyConversationInterface.js'

const ChatApi: ApiGroup<AgencySQL> = {
  // POST endpoints are used to send messages to the server:
  '/chat/newChat': {
    method: 'post',
    handler: async (
      req: any,
      res: any,
      params: any,
      body: NewChatInput,
      agency: AgencySQL,
      userId: string,
    ): Promise<{ success: boolean, chatId: string }> => {
      console.log('params', params)
      console.log('body', body)
      console.log('agency', agency)

      const user = await UserInterface.getUser(userId)
      if (!user) {
        throw new Error('Unauthorized')
      }

      // data is verified in handler:
      const agencyConversationId = await newChatHandler(user, body)

      return {
        success: true,
        chatId: agencyConversationId,
      }
    },
  },

  '/chat/newMessage': {
    method: 'post',
    handler: async (
      req: any,
      res: any,
      params: any,
      body: NewMessageInput,
      agency: AgencySQL,
      userId: string,
    ) => {
      console.log('params', params)
      console.log('body', body)
      console.log('agency', agency)

      const user = await UserInterface.getUser(userId)
      if (!user) {
        throw new Error('Unauthorized')
      }

      // data is verified in handler:
      newMessageHandler(user, body)

      return {
        success: true,
      }
    },
  },

  '/chat/loadChat': {
    method: 'post',
    handler: async (
      req: any,
      res: any,
      params: any,
      body: LoadChatInput,
      agency: AgencySQL,
      userId: string,
    ) => {
      console.log('params', params)
      console.log('body', body)
      console.log('agency', agency)

      const user = await UserInterface.getUser(userId)
      if (!user) {
        throw new Error('Unauthorized')
      }

      // data is verified in handler:
      loadChatHandler(user, body)

      return {
        success: true,
      }
    },
  },

  // A GET SSE endpoint is used to receive messages from the server:
  '/chat/:agencyConversationId/sse': {
    method: 'post',
    handler: async (
      req: any,
      res: any,
      params: {
        agencyConversationId: string, // synonymous with chatId
      },
      body: any,
      agency: AgencySQL,
      userId: string,
    ) => {
      res.set('Content-Type', 'text/event-stream')
      res.set('Cache-Control', 'no-cache')
      res.set('Connection', 'keep-alive')

      console.log('params', params)
      console.log('body', body)
      console.log('agency', agency)

      const { agencyConversationId } = params

      // todo:
      //  register the sse connection to a global state variable mapped to agencyConversationId.
      //  There may be multiple conversations happening at once for an agency.
      //  A client can only listen to a single conversation at a time.

      // Since this SSE endpoint requires a agencyConversationId, there is a chicken and egg problem
      // between /chat/newChat and this endpoint.
      // When starting a new chat,
      // the client must call /chat/newChat, which will return an agencyConversationId.
      // The newChatHandler will emit appendMessage and updateName events before the client has subscribed to /sse.
      // Because the client will miss these events, updateName is re-emitted when /sse is established.
      // The client is expected to call /chat/loadChat after /sse, and this will deliver the missed appendMessage event.
      // There is a chance the client may receive both updateName events.
      // This is okay because the second updateName event will not actually change anything.

      // verify inputs:
      const agencyConversation = await AgencyConversationInterface.getOwned(
        userId,
        agencyConversationId,
      )
      if (!agencyConversation) {
        throw new Error('Unauthorized')
      }

      registerSSE(agencyConversationId, res)

      // Although agencyConversation.name is available, this method of re-emitting avoids race condition:
      const updateNameEvent: ?UpdateNameOutput =
        updateNameEvents[agencyConversationId]
      if (updateNameEvent) {
        res.write(
          `data: ${JSON.stringify({
            type: 'updateName',
            output: updateNameEvent,
          })}\n\n`,
        )
      }
    },
  },
}

export default ChatApi
