// @flow

import AgencyInterface from '../schema/Agency/AgencyInterface.js'
import AgentConversationInterface from '../schema/AgentConversation/AgentConversationInterface.js'
import MessageInterface from '../schema/Message/MessageInterface.js'
import { MessageRole, MessageType } from '../schema/Message/MessageSchema.js'
import type {
  MessageData,
  MessageSQL,
} from '../schema/Message/MessageSchema.js'
import AgentMind from '../agent/AgentMind.js'
import type { UserSQL } from '../schema/User/UserSchema.js'
import type { AppendMessageOutput, NewMessageInput } from './callbacks.js'
import { getCallbacks } from './callbacks.js'

async function newMessageHandler(user: UserSQL, data: NewMessageInput) {
  console.debug('newMessage', data)
  // const openAiKey = user?.openAiKey
  // if (!openAiKey) {
  //   throw new Error('Unauthorized')
  // }
  const model = user.models.find((model) => model.title === data.modelTitle)
  if (!model) {
    throw new Error('That model does not exist in your account.')
  }

  if (!data.agencyId) {
    throw new Error('JSON body missing agencyId')
  }
  if (!data.chatId) {
    throw new Error('JSON body missing chatId')
  }
  if (!data.userPrompt) {
    throw new Error('JSON body missing userPrompt')
  }
  if (typeof data.agencyId !== 'number') {
    throw new Error('agencyId must be a number')
  }
  if (typeof data.chatId !== 'string') {
    throw new Error('chatId must be a string')
  }
  if (typeof data.userPrompt !== 'string') {
    throw new Error('userPrompt must be a string')
  }

  // Make sure the agent the message is for is not currently processing a chatIteration.
  // If it is, then the message will be processed after the current one finishes.
  // The implementation of AgentMind handles queueing internally.

  // Verify ownership of agencyId.
  const agency = await AgencyInterface.getOwned(data.agencyId, user.userId)
  if (!agency) {
    throw new Error('Unauthorized')
  }

  // Since agency ownership is confirmed, manager ownership is also confirmed.
  // This also verifies the chatId.
  const managerAgentConversation = await AgentConversationInterface.getManager(
    agency.agencyId,
    data.chatId,
  )
  if (!managerAgentConversation) {
    throw new Error(
      `Unable to find the manager's conversation for this agency conversation.`,
    )
  }

  const callbacks = await getCallbacks(user.userId, data.chatId)

  const managerAgentConversationId =
    managerAgentConversation.agentConversationId

  const previousResponseMessages = await MessageInterface.getAll(
    managerAgentConversationId,
  )
  const lastMessage =
    previousResponseMessages[previousResponseMessages.length - 1]
  if (!lastMessage) {
    throw new Error('Unable to find last message.')
  }

  // The lastMessage should be of type Response with a non-empty text.
  // If it is not, then the client is sending a message before the agent has finished the previous response.
  // todo: queue message
  // const lastMessageText = JSON.parse(lastMessage.data.text)
  // if (lastMessageText.type !== MessageType.Response) {
  //   throw new Error(
  //     'The message could not be submitted because a response is still being generated for the previous submission.',
  //   )
  // }
  // if (!lastMessageText.text) {
  //   throw new Error(
  //     'The message could not be submitted because a response is still being generated for the previous submission.',
  //   )
  // }

  // Insert next message from user to manager so that UI will see it:
  const userMessageData: MessageData = {
    fromApi: true,
    toAgentId: managerAgentConversation.agentId,
    text: data.userPrompt,
  }
  const userMessage: MessageSQL = await MessageInterface.insert(
    managerAgentConversation.agentId,
    managerAgentConversationId,
    MessageRole.USER,
    userMessageData,
  )

  console.log('userMessage', userMessage)

  // Send this message to the client so that it can be displayed.
  const output: AppendMessageOutput = {
    agencyId: data.agencyId,
    chatId: data.chatId,
    managerAgentId: managerAgentConversation.agentId,
    message: userMessage,
  }
  callbacks.appendMessage(output)

  // Start the next chat iteration with the AgentMind, and stream token updates to client:
  AgentMind.chatIteration(
    user,
    model,
    data.agencyId,
    managerAgentConversation.agentId,
    data.chatId,
    managerAgentConversationId,
    data.userPrompt, // This was already inserted into Message table.
    callbacks.appendMessage,
    callbacks.updateMessage,
    callbacks.error,
  )
}

export default newMessageHandler
