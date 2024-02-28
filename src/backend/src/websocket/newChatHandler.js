// @flow

import AgencyInterface from '../schema/Agency/AgencyInterface.js'
import {
  createNewChat,
  generateName,
} from '../rest/internal/InternalChatApi.js'
import AgentMind from '../agent/AgentMind.js'
import type { UserSQL } from '../schema/User/UserSchema.js'
import type { NewChatInput } from './callbacks.js'
import { getCallbacks } from './callbacks.js'

const newChatHandler = async (
  user: UserSQL,
  data: NewChatInput,
): Promise<string> => {
  console.debug('newChat', data)
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
  if (!data.userPrompt) {
    throw new Error('JSON body missing userPrompt')
  }
  if (typeof data.agencyId !== 'number') {
    throw new Error('agencyId must be a number')
  }
  if (typeof data.userPrompt !== 'string') {
    throw new Error('userPrompt must be a string')
  }

  // Verify ownership of agencyId.
  const agency = await AgencyInterface.getOwned(data.agencyId, user.userId)
  if (!agency) {
    throw new Error('Unauthorized')
  }

  // User message is inserted into Message table in createNewChat:
  const {
    newChatOutput,
    managerAgentId,
    managerVersionId,
    managerAgentConversationId,
    firstChatMessage,
  } = await createNewChat(user.userId, data)

  const callbacks = await getCallbacks(user.userId, managerAgentConversationId)

  callbacks.newChat(newChatOutput)
  callbacks.appendMessage({
    agencyId: newChatOutput.agencyId,
    chatId: newChatOutput.chatId,
    managerAgentId: newChatOutput.managerAgentId,
    message: firstChatMessage,
  })

  // Name update can happen asychronously:
  Promise.resolve().then(async () => {
    try {
      const updateNameOutput = await generateName(
        newChatOutput.agencyId,
        newChatOutput.chatId,
        managerAgentId,
        user,
        'New Chat',
        data.userPrompt,
      )
      // console.debug('updateName', updateNameOutput)
      callbacks.updateName(updateNameOutput)
    } catch (err) {
      console.error(err)
    }
  })

  // Start an asynchronous chat iteration with the AgentMind.
  // This can fire off additional iterations,
  // so this starts off long running asynchronous process:
  AgentMind.chatIteration(
    user,
    data.agencyId,
    managerVersionId,
    newChatOutput.chatId,
    managerAgentConversationId,
    // This was already inserted into Message table in createNewChat.
    // This is done so that after the client receives newChatOutput, it will load the first message via graphql.
    // This allows us to send newChatOutput before starting a chat iteraction, resulting in quicker UI response.
    data.userPrompt,
    callbacks.appendMessage,
    callbacks.updateMessage,
  )

  return newChatOutput.chatId
}

export default newChatHandler
