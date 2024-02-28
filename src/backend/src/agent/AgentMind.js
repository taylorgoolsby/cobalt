// @flow

/*
  Represents the mind of a single agent.

  A single agent's mind can be thought of as being a combination of multiple sub-tasks:
  - Decide who to send a response to.
  - Decide what to say to the target.
  - Double check if there's anyone else who should receive a message.
  - Double check all the messages sent to all parties and see if there is any further messages
      that need to be sent.

  In a single-agent approach, a single message sent to the GPT will cause it to generate a single response
  which is sent back to the client.

  In this multi-agent approach, a single message is processed through multiple /chat/completions calls.
  Each call contains a slightly different array of contextual messages in order to produce different responses
  for the various sub-tasks listed above.

  One cycle of this process is called a "chat iteration". It starts with receiving a message from a party,
  and ends with an array of messages to be sent to various parties, of which, at least one message should
  be sent back to the originating party as a response, at least an acknowledgment.

  The Messages table in the database only records inter-messages, IE, messages sent between parties.
  Intra-messages, IE, messages used internally within a single agent's mind, are not recorded in the database.

  The messages recorded in the database are used display to the frontend for debugging agency instruction,
  and for preparing contextual message history.
* */

import type { EnvokeMind } from './mindQueue.js'
import type { AgentSQL } from '../schema/Agent/AgentSchema.js'
import type {
  MessageData,
  MessageSQL,
} from '../schema/Message/MessageSchema.js'
import MessageInterface from '../schema/Message/MessageInterface.js'
import type { GPTMessage } from '../rest/InferenceRest.js'
import InferenceRest from '../rest/InferenceRest.js'
import type { ChatCompletionsResponse } from '../rest/InferenceRest.js'
import { MessageRole, MessageType } from '../schema/Message/MessageSchema.js'
import type {
  AppendMessageOutput,
  UpdateMessageOutput,
} from '../websocket/callbacks.js'
import AgentInterface from '../schema/Agent/AgentInterface.js'
import AgentConversationInterface from '../schema/AgentConversation/AgentConversationInterface.js'
import { getCallbacks } from '../websocket/callbacks.js'
import { dequeue, enqueue } from './mindQueue.js'
import type { UserSQL } from '../schema/User/UserSchema.js'

export default class AgentMind {
  static chatIteration(
    // These inputs should be verified for ownership already:
    user: UserSQL,
    agencyId: number,
    currentAgentVersionId: number,
    agencyConversationId: string,
    agentConversationId: string,
    // The userPrompt should have already been inserted into Message table:
    userPrompt: string,
    onMessageFromAgent: (output: AppendMessageOutput) => any,
    onUpdateMessage: (output: UpdateMessageOutput) => any,
  ): void {
    const userId = user.userId

    Promise.resolve().then(async () => {
      try {
        const agents = await AgentInterface.getAll(agencyId)
        const agentMap: { [agentVersionId: number]: AgentSQL } = {}
        let managerAgent
        for (const agent of agents) {
          agentMap[agent.versionId] = agent
          if (agent.isManager) {
            managerAgent = agent
          }
        }

        if (!managerAgent) {
          throw new Error('Manager agent not found.')
        }

        const currentAgent = agentMap[currentAgentVersionId]
        if (!currentAgent) {
          throw new Error('Agent not found.')
        }

        // See readme.md for an overview of the chat iteration process.

        // Get all messages for this conversation:
        const startingMessages = await MessageInterface.getAll(
          agentConversationId,
        )

        const context: Array<GPTMessage> = []

        let newIterationWillBeStarted = false

        const envokeMind: ?EnvokeMind = await generateResponse(
          user,
          agencyId,
          currentAgent,
          managerAgent,
          agencyConversationId,
          agentConversationId,
          context,
          (output: AppendMessageOutput) => onMessageFromAgent(output),
          (output: UpdateMessageOutput) => {
            onUpdateMessage(output)
          },
        ).then(async (response: MessageSQL): Promise<?EnvokeMind> => {
          // The following is stuff to do after the response has been generated.
          // It was from AgencyAI, where agents can talk to other agents.
          // This is not needed for this project.
          // const nextPrompt = JSON.parse(response.data.text).text
          // if (nextAgentVersionId === null) {
          //   console.log('Response to end user.')
          // }
          // When an iteration is complete, we need to start a new iteration for each agent in the toList.
          // if (nextAgentVersionId !== null) {
          //   const nextAgent = agentMap[nextAgentVersionId]
          //   if (!nextAgent) {
          //     console.error(
          //       `Unable to find agent given (agencyId, nextAgentVersionId): (${agencyId}, ${nextAgentVersionId})`,
          //     )
          //     return
          //   }
          //
          //   const nextAgentConversation =
          //     await AgentConversationInterface.get(
          //       agencyConversationId,
          //       nextAgent.agentId,
          //     )
          //   if (!nextAgentConversation) {
          //     console.error(
          //       `Unable to find agentConversation for agent ${nextAgent.versionId}`,
          //     )
          //     return
          //   }
          //
          //   // Send nextPrompt to next agent as a GetToList message.
          //   const userMessageData: MessageData = {
          //     fromAgentId: currentAgent.versionId,
          //     toAgentId: nextAgentVersionId,
          //     text: JSON.stringify({
          //       type: MessageType.GetToList,
          //       messages: [
          //         {
          //           from: currentAgent.versionId,
          //           text: nextPrompt,
          //         },
          //       ],
          //     }),
          //   }
          //   const userMessage: MessageSQL = await MessageInterface.insert(
          //     nextAgent.agentId,
          //     nextAgentConversation.agentConversationId,
          //     // When an agent sends a message to another agent, it is a user message.
          //     // Responses from agents are assistant messages.
          //     MessageRole.USER,
          //     userMessageData,
          //   )
          //
          //   await MessageInterface.linkMessages(
          //     response.messageId,
          //     userMessage.messageId,
          //   )
          //   userMessage.linkedMessageId = response.messageId
          //   response.linkedMessageId = userMessage.messageId
          //
          //   // Update the client for the newly linkedMessageId:
          //   onUpdateMessage({
          //     agencyId,
          //     chatId: agencyConversationId,
          //     managerAgentId: managerAgent.agentId,
          //     agentId: currentAgent.agentId,
          //     message: response,
          //   })
          //
          //   // Send this message to the client so that it can be displayed.
          //   const output: AppendMessageOutput = {
          //     agencyId: agencyId,
          //     chatId: agencyConversationId,
          //     managerAgentId: managerAgent.agentId,
          //     message: userMessage,
          //   }
          //   onMessageFromAgent(output)
          //
          //   console.log(
          //     `Queued message: ${currentAgent.versionId} -> ${nextAgentVersionId}`,
          //   )
          //   return () =>
          //     AgentMind.chatIteration(
          //       user,
          //       agencyId,
          //       nextAgentVersionId,
          //       agencyConversationId,
          //       nextAgentConversation.agentConversationId,
          //       nextPrompt,
          //       onMessageFromAgent,
          //       onUpdateMessage,
          //     )
          // }
        })

        // The following envokeMind queueing is used to start the next iteration,
        // which was something that was used in AgencyAI to enable back and forth communication
        // between agents. This is not needed in the current implementation.
        // if (envokeMind) {
        //   await enqueue(envokeMind)
        //   newIterationWillBeStarted = true
        // }
        // const nextEnvocation = await dequeue()
        // if (nextEnvocation) {
        //   nextEnvocation()
        // }

        // todo: When using Lambdas and SQS,
        //  the connection back to the client is held by a master server,
        //  and all lambdas send messages back to the master server via webhook.
        if (!newIterationWillBeStarted) {
          // Close SSE connections:
          const callbacks = await getCallbacks(userId, agencyConversationId)
          callbacks.stoppedIterating()
        }
      } catch (err) {
        console.error(err)
      }
    })
  }
}

class RetryError extends Error {
  constructor(message: any) {
    super(message)
    this.name = 'RetryError'
  }
}

function generateResponse(
  user: UserSQL,
  agencyId: number,
  agent: AgentSQL,
  managerAgent: AgentSQL,
  agencyConversationId: string,
  agentConversationId: string,
  context: Array<GPTMessage>,
  onAppendMessage: (output: AppendMessageOutput) => any,
  onUpdateMessage: (output: UpdateMessageOutput) => any,
): Promise<MessageSQL> {
  return new Promise(async (resolve, reject) => {
    try {
      // In this mod of AgencyAI, all messages go to the end user.
      // There is also no JSON mode.
      const responseMessageData: MessageData = {
        fromAgentId: agent.versionId,
        toAgentId: null,
        toApi: true,
        text: '',
      }

      // The response is already added to the database before streaming starts as an empty message.
      const responseMessage = await MessageInterface.insert(
        agent.agentId,
        agentConversationId,
        MessageRole.ASSISTANT,
        responseMessageData,
      )
      responseMessage.id = responseMessage.messageId.toString()

      // Similarly the response is sent to the client as an empty message to start.
      const output: AppendMessageOutput = {
        agencyId,
        chatId: agencyConversationId,
        managerAgentId: managerAgent.agentId,
        message: responseMessage,
      }

      onAppendMessage(output)

      let buffer = ''
      let previousAutocompletion = null

      // todo: send error to UI
      let stop = false

      let timeout
      function startTimeout() {
        if (timeout) {
          clearTimeout(timeout)
          timeout = null
        }
        timeout = setTimeout(() => {
          // todo: If timeout,
          //  then retry without system message.
          //  But maybe this isn't needed because InferenceRest.relayChatCompletionStream already does 3 retries.
          stop = true
          const error = new Error('Event stream timeout.')
          reject(error)
        }, 30000) // 30 seconds
      }

      startTimeout()

      // Send a /chat/completions call
      InferenceRest.relayChatCompletionStream(
        user,
        context,
        (res: ChatCompletionsResponse) => {
          if (stop) {
            return
          }
          startTimeout()

          // Check the finish_reason:
          const finishReason = res.choices[0]?.finish_reason

          if (finishReason === 'length') {
            const error = new Error('The maximum number of tokens was reached.')
            reject(error)
            throw error
          } else if (finishReason === 'content_filter') {
            const error = new Error('A content filter flag was raised.')
            reject(error)
            throw error
          } else if (finishReason === 'tool_calls') {
            const error = new Error('Tool calls are not yet implemented.')
            reject(error)
            throw error
          } else if (finishReason !== 'stop' && finishReason !== null) {
            const error = new Error('Unknown finish reason.')
            reject(error)
            throw error
          }

          // todo: check if finish_reason=stop always has an empty delta.
          //  Do not send a token update if it does as this would be redundant.

          const text = res?.choices[0]?.delta?.content || ''

          buffer += text

          // Used for JSON mode:
          // if (buffer.length < intro.length) {
          //   // The buffer is not long enough to contain the intro.
          //   return
          // }
          // const autocompletion = JSON.stringify(parseIncompleteJSON(buffer))

          const autocompletion = buffer

          const messageChanged = autocompletion !== previousAutocompletion
          previousAutocompletion = autocompletion

          if (!messageChanged && finishReason !== 'stop') {
            // console.debug('Autocompletion matched delta, no change.')
            return
          }

          // send:
          responseMessage.data.text = autocompletion

          if (finishReason === 'stop') {
            // todo: If stop reached but autocompletion.text is empty still,
            //  then retry after sending system message trying to correct.

            stop = true
            responseMessage.data.completed = true
            Promise.resolve()
              .then(async () => {
                // console.debug('saving complete message: ', finalText)
                await MessageInterface.completeData(
                  responseMessage.messageId,
                  responseMessage.data,
                )
                resolve(responseMessage)
              })
              .catch((err) => {
                console.error(err)
                reject(err)
              })
          }

          const output: UpdateMessageOutput = {
            agencyId,
            chatId: agencyConversationId,
            managerAgentId: managerAgent.agentId,
            agentId: agent.agentId,
            message: responseMessage,
          }
          onUpdateMessage(output)
        },
        () => {
          reject(new Error('Unable to get response from GPT.'))
        },
      )
    } catch (err) {
      console.error(err)
      reject(err)
    }
  })
}

function parseIncompleteJSON(buffer: string): {
  type: 'Response',
  text: string,
} {
  const matchType = buffer.match(
    /{(?:.|\n)*(?:(?<!\\)"type(?<!\\)":\s*(?<!\\)"(.*?)(?:\\$|(?<!\\)$|(?<!\\)"))/,
  )
  const matchText = buffer.match(
    /{(?:.|\n)*(?:(?<!\\)"text(?<!\\)":\s*(?<!\\)"(.*?)(?:\\$|(?<!\\)$|(?<!\\)"))/,
  )

  const type = matchType?.[1] ?? ''
  const text = matchText?.[1] ?? ''

  if (type !== 'Response' && !'Response'.startsWith(type)) {
    throw new Error('The type must be Response.')
  }

  const result = {
    type: 'Response',
    // This text is actually stringified, but incomplete JSON.
    text,
  }

  // Since we are returning an object, we need to parse the incomplete text string.
  result.text = JSON.parse(`"${result.text}"`)

  return result
}
