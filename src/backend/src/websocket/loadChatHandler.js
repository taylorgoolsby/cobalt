// @flow

import type {
  AppendMessageOutput,
  Callbacks,
  LoadChatInput,
  UpdateMessageOutput,
} from './callbacks.js'
import type { MessageSQL } from '../schema/Message/MessageSchema.js'
import AgentConversationInterface from '../schema/AgentConversation/AgentConversationInterface.js'
import MessageInterface from '../schema/Message/MessageInterface.js'
import type { UserSQL } from '../schema/User/UserSchema.js'
import { getCallbacks } from './callbacks.js'
import AgencyInterface from '../schema/Agency/AgencyInterface.js'
import AgentInterface from '../schema/Agent/AgentInterface.js'

async function loadChatHandler(user: UserSQL, data: LoadChatInput) {
  console.debug('loadChat', data)
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

  if (!data.agencyId) {
    throw new Error('JSON body missing agencyId')
  }
  if (!data.chatId) {
    throw new Error('JSON body missing chatId')
  }
  if (typeof data.agencyId !== 'number') {
    throw new Error('agencyId must be a number')
  }
  if (typeof data.chatId !== 'string') {
    throw new Error('chatId must be a string')
  }
  if (data.lastMessageIds && typeof data.lastMessageIds !== 'object') {
    throw new Error('lastMessageIds must be an object')
  }
  // We don't validate the contents of lastMessageIds here.
  // Check the implementation of dirtyLastMessageIds below.

  const agency = await AgencyInterface.getOwned(data.agencyId, user.userId)
  if (!agency) {
    throw new Error('Agency not found')
  }

  const managerAgent = await AgentInterface.getManager(data.agencyId)
  if (!managerAgent) {
    throw new Error('Manager agent not found')
  }

  const agentConversations = await AgentConversationInterface.getAllOwned(
    data.chatId,
    user.userId,
  )
  if (!agentConversations.length) {
    throw new Error('There should be at least one agent in the agency.')
  }

  const callbacks = await getCallbacks(user.userId, data.chatId)

  const agentIds: Array<number> = agentConversations.map((chat) => chat.agentId)

  // lastMessageIds might not have all agentIds reported.
  const dirtyLastMessageIds: { [agentId: any]: any } = data.lastMessageIds ?? {}
  const lastMessageIds: { [agentId: number]: number } = {}
  for (const agentId of agentIds) {
    const messageId = parseInt(dirtyLastMessageIds[agentId])
    if (typeof messageId === 'number' && !isNaN(messageId)) {
      lastMessageIds[agentId] = messageId
    }
  }

  // Since every agentId was obtained in a way that verified ownership, we can verify ownership of messageIds.
  const messages = await MessageInterface.getUnderBatch(agentIds)

  const messageMap: { [messageId: number]: MessageSQL } = {}
  for (const message of messages) {
    messageMap[message.messageId] = message
  }

  // messages are ordered, but mixed between agents
  // so they will be pushed in order:
  const agentConversationIdToMessages: {
    [agentConversationId: string]: Array<MessageSQL>,
  } = {}
  for (const message of messages) {
    // todo: big loop, needs async
    if (!agentConversationIdToMessages[message.agentConversationId]) {
      agentConversationIdToMessages[message.agentConversationId] = []
    }
    agentConversationIdToMessages[message.agentConversationId].push(message)
  }

  // On a reconnect, the last message for each agent might be incomplete.
  // Go through data.lastMessageIds and emit UpdateMessage for each of them to make sure those are up to date.
  for (const conversation of agentConversations) {
    const lastMessageId: ?number = lastMessageIds[conversation.agentId]
    if (!lastMessageId) {
      // A lastMessageId was not reported for this agent.
      // No updateMessage event is emitted.
      continue
    }
    const lastMessage = messageMap[lastMessageId]
    if (lastMessage) {
      const output: UpdateMessageOutput = {
        agencyId: data.agencyId,
        chatId: data.chatId,
        managerAgentId: managerAgent.agentId,
        agentId: conversation.agentId,
        message: lastMessage,
        // todo: when loadData is used for reconnect or chat switching,
        //  ongoing completions should be sent to the client.
        //  If there are no ongoing completions, then send done=true.
        // done: false,
      }
      // console.debug('updateMessage', output)
      callbacks.updateMessage(output)
    }
  }

  // For each agentConversationId, emit AppendMessage for any messages which come after lastMessageId.
  for (const conversation of agentConversations) {
    // todo: big loop, needs async
    const lastMessageId: ?number = lastMessageIds[conversation.agentId]
    const messages =
      agentConversationIdToMessages[conversation.agentConversationId]
    if (!messages) {
      continue
    }
    let startEmitting = !lastMessageId // emit all messages if lastMessageId is not reported
    for (const message of messages) {
      if (!startEmitting) {
        if (message.messageId === lastMessageId) {
          // The next message after this one will be emitted.
          startEmitting = true
        }
        continue
      }

      const output: AppendMessageOutput = {
        agencyId: data.agencyId,
        chatId: data.chatId,
        managerAgentId: managerAgent.agentId,
        message: message,
      }
      callbacks.appendMessage(output)
    }
  }

  callbacks.loadChat({
    agencyId: data.agencyId,
    chatId: data.chatId,
    managerAgentId: managerAgent.agentId,
  })
}

export default loadChatHandler
