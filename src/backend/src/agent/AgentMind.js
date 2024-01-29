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
import type { GPTMessage } from '../rest/ChatGPTRest.js'
import ChatGPTRest from '../rest/ChatGPTRest.js'
import type { ChatCompletionsResponse } from '../rest/ChatGPTRest.js'
import { MessageRole, MessageType } from '../schema/Message/MessageSchema.js'
import type {
  AppendMessageOutput,
  UpdateMessageOutput,
} from '../websocket/callbacks.js'
import AgentInterface from '../schema/Agent/AgentInterface.js'
import AgentConversationInterface from '../schema/AgentConversation/AgentConversationInterface.js'
import { getCallbacks } from '../websocket/callbacks.js'
import { dequeue, enqueue } from './mindQueue.js'

export default class AgentMind {
  static chatIteration(
    // These inputs should be verified for ownership already:
    userId: string,
    openAiKey: string,
    agencyId: number,
    currentAgentVersionId: number,
    agencyConversationId: string,
    agentConversationId: string,
    // The userPrompt should have already been inserted into Message table:
    userPrompt: string,
    onMessageFromAgent: (output: AppendMessageOutput) => any,
    onUpdateMessage: (output: UpdateMessageOutput) => any,
  ): void {
    Promise.resolve().then(async () => {
      try {
        // console.debug('chatIteration')

        // todo: whenever an agent receives a new message,
        //  if it is already in the middle of a chatIteration,
        //  then the incoming message is queued.

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

        // Get all messages for this conversation:
        const startingMessages = await MessageInterface.getAll(
          agentConversationId,
        )

        /*
          The following section contains extra messages we append to the end of every user message.
          This can be usful for nullifying any instruction by the end user to change behavior,
          and also to reinforce desired behavior.
        * */
        // This extra message was needed to get gpt-3.5-turbo to start responding in JSON:
        // originalGptMessages.push({
        //   role: 'user',
        //   content: 'Respond in JSON format.',
        // })

        const toList = await generateToListWithRetry(
          openAiKey,
          currentAgent.model,
          startingMessages,
          agentConversationId,
          currentAgent,
          managerAgent,
          agentMap,
          3,
        )

        const toListMessage = await MessageInterface.insert(
          currentAgent.agentId,
          agentConversationId,
          MessageRole.SYSTEM,
          {
            fromAgentId: currentAgent.versionId,
            text: JSON.stringify(toList),
          },
        )

        const messagesWithToList = [...startingMessages, toListMessage]

        let newIterationWillBeStarted = false
        // Create a blank Message row for each agent in the toList.
        for (const nextAgentVersionId of toList.to) {
          if (nextAgentVersionId === currentAgent.versionId) {
            // Agent's aren't supposed to send messages to themselves.
            console.error('Agent is sending a message to itself.')
            // todo: send this error to the agent as a system message. Maybe the agent will learn not to repeat this mistake.
            continue
          }
          if (nextAgentVersionId !== null && !agentMap[nextAgentVersionId]) {
            console.error('Agent is sending an agent that does not exist.')
            continue
          }

          // $FlowFixMe
          console.log(
            `Building response: ${currentAgent.versionId} -> ${
              nextAgentVersionId ?? 'end user'
            }`,
          )

          // For each blank message, each going to a different party,
          // stream a completion for the content of the response.

          const envokeMind: ?EnvokeMind = await generateResponse(
            openAiKey,
            agencyId,
            currentAgent,
            managerAgent,
            agencyConversationId,
            agentConversationId,
            messagesWithToList,
            nextAgentVersionId,
            (output: AppendMessageOutput) => onMessageFromAgent(output),
            (output: UpdateMessageOutput) => {
              onUpdateMessage(output)
            },
          ).then(async (response: MessageSQL): Promise<?EnvokeMind> => {
            const nextPrompt = JSON.parse(response.data.text).text

            if (nextAgentVersionId === null) {
              console.log('Response to end user.')
            }

            // When an iteration is complete, we need to start a new iteration for each agent in the toList.
            if (nextAgentVersionId !== null) {
              const nextAgent = agentMap[nextAgentVersionId]
              if (!nextAgent) {
                console.error(
                  `Unable to find agent given (agencyId, nextAgentVersionId): (${agencyId}, ${nextAgentVersionId})`,
                )
                return
              }

              const nextAgentConversation =
                await AgentConversationInterface.get(
                  agencyConversationId,
                  nextAgent.agentId,
                )
              if (!nextAgentConversation) {
                console.error(
                  `Unable to find agentConversation for agent ${nextAgent.versionId}`,
                )
                return
              }

              // Send nextPrompt to next agent as a GetToList message.
              const userMessageData: MessageData = {
                fromAgentId: currentAgent.versionId,
                toAgentId: nextAgentVersionId,
                text: JSON.stringify({
                  type: MessageType.GetToList,
                  messages: [
                    {
                      from: currentAgent.versionId,
                      text: nextPrompt,
                    },
                  ],
                }),
              }
              const userMessage: MessageSQL = await MessageInterface.insert(
                nextAgent.agentId,
                nextAgentConversation.agentConversationId,
                // When an agent sends a message to another agent, it is a user message.
                // Responses from agents are assistant messages.
                MessageRole.USER,
                userMessageData,
              )

              await MessageInterface.linkMessages(
                response.messageId,
                userMessage.messageId,
              )
              userMessage.linkedMessageId = response.messageId
              response.linkedMessageId = userMessage.messageId

              // Update the client for the newly linkedMessageId:
              onUpdateMessage({
                agencyId,
                chatId: agencyConversationId,
                managerAgentId: managerAgent.agentId,
                agentId: currentAgent.agentId,
                message: response,
              })

              // Send this message to the client so that it can be displayed.
              const output: AppendMessageOutput = {
                agencyId: agencyId,
                chatId: agencyConversationId,
                managerAgentId: managerAgent.agentId,
                message: userMessage,
              }
              onMessageFromAgent(output)

              console.log(
                `Queued message: ${currentAgent.versionId} -> ${nextAgentVersionId}`,
              )
              return () =>
                AgentMind.chatIteration(
                  userId,
                  openAiKey,
                  agencyId,
                  nextAgentVersionId,
                  agencyConversationId,
                  nextAgentConversation.agentConversationId,
                  nextPrompt,
                  onMessageFromAgent,
                  onUpdateMessage,
                )
            }
          })
          if (envokeMind) {
            await enqueue(envokeMind)
            newIterationWillBeStarted = true
          }
        }

        const nextEnvocation = await dequeue()
        if (nextEnvocation) {
          nextEnvocation()
        }

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

type ToList = {
  type: 'ToList',
  to: Array<number | null>,
}

class RetryError extends Error {
  constructor(message: any) {
    super(message)
    this.name = 'RetryError'
  }
}

async function generateToListWithRetry(
  openAiKey: string,
  model: string,
  messages: Array<MessageSQL>,
  agentConversationId: string,
  currentAgent: AgentSQL,
  managerAgent: AgentSQL,
  agentMap: { [agentId: number]: AgentSQL },
  retryCount: number,
): Promise<ToList> {
  if (retryCount <= 0) {
    throw new Error('Retry count exceeded.')
  }

  try {
    return await generateToList(
      openAiKey,
      model,
      messages,
      currentAgent,
      managerAgent,
      agentMap,
    )
  } catch (err) {
    console.error(err)

    if (err instanceof RetryError) {
      console.debug('retrying')

      const systemMessageData: MessageData = {
        correctionInstruction: true,
        text: err.message,
      }

      const systemMessage = await MessageInterface.insert(
        currentAgent.agentId,
        agentConversationId,
        MessageRole.SYSTEM,
        systemMessageData,
      )

      return await generateToListWithRetry(
        openAiKey,
        model,
        [...messages, systemMessage],
        agentConversationId,
        currentAgent,
        managerAgent,
        agentMap,
        retryCount - 1,
      )
    }

    throw err
  }
}

async function generateToList(
  openAiKey: string,
  model: string,
  messages: Array<MessageSQL>,
  currentAgent: AgentSQL,
  managerAgent: AgentSQL,
  agentMap: { [agentId: number]: AgentSQL },
): Promise<ToList> {
  const isCurrentManager = currentAgent.agentId === managerAgent.agentId

  // Format messages for /chat/completions:
  const gptMessages: Array<GPTMessage> = messages.map((m) => ({
    role: m.role.toLowerCase(),
    content: m.data.text,
  }))

  const lastMessage = gptMessages.findLast(
    (message) => message.role !== 'system',
  )
  if (!lastMessage) {
    throw new Error('No last non-system message found.')
  }
  const lastMessageContent = JSON.parse(lastMessage.content)
  if (lastMessageContent.type !== MessageType.GetToList) {
    throw new Error('The last message must be a GetToList message.')
  }

  console.debug('generate ToList')
  const res = await ChatGPTRest.chatCompletion(openAiKey, model, gptMessages)

  const finishReason = res.choices[0]?.finish_reason

  if (finishReason === 'length') {
    throw new Error('The maximum number of tokens was reached.')
  } else if (finishReason === 'content_filter') {
    throw new Error('A content filter flag was raised.')
  } else if (finishReason === 'tool_calls') {
    throw new Error('Tool calls are not yet implemented.')
  } else if (finishReason !== 'stop') {
    throw new Error('Unknown finish reason.')
  }

  const text = res.choices[0]?.message?.content || ''

  console.log('ToList:', text)

  let parsedText
  try {
    parsedText = JSON.parse(text)
  } catch (err) {
    console.error(text)
    throw new RetryError('The response could not be parsed into JSON.')
  }

  if (parsedText.type !== MessageType.ToList) {
    console.error(text)
    throw new RetryError(`The response must be a ToList.`)
  }

  if (!Array.isArray(parsedText.to)) {
    console.error(text)
    throw new RetryError(`The response must include a "to" array.`)
  }

  for (const agentId of parsedText.to) {
    if (agentId !== null && typeof agentId !== 'number') {
      console.error(text)
      throw new RetryError(`The "to" array must contain only numbers or null.`)
    }

    if (agentId !== null && !agentMap[agentId]) {
      throw new RetryError(
        `The "to" array contained an agentId that does not exist.`,
      )
    }

    if (!isCurrentManager && agentId === null) {
      throw new RetryError(
        `The "to" array contained null, signifying the intent to send a message to the end user, but only the manager agent can do this.`,
      )
    }
  }

  return parsedText
}

function generateResponse(
  openAiKey: string,
  agencyId: number,
  agent: AgentSQL,
  managerAgent: AgentSQL,
  agencyConversationId: string,
  agentConversationId: string,
  messages: Array<MessageSQL>,
  forAgentVersionId: number | null,
  onAppendMessage: (output: AppendMessageOutput) => any,
  onUpdateMessage: (output: UpdateMessageOutput) => any,
): Promise<MessageSQL> {
  return new Promise(async (resolve, reject) => {
    try {
      const getResponseMessageData: MessageData = {
        internalInstruction: true,
        text: JSON.stringify({
          type: 'GetResponse',
          for: forAgentVersionId,
        }),
      }

      const getResponseMessage = await MessageInterface.insert(
        agent.agentId,
        agentConversationId,
        MessageRole.SYSTEM,
        getResponseMessageData,
      )

      // Format messages for /chat/completions:
      const gptMessages: Array<GPTMessage> = [
        ...messages,
        getResponseMessage,
      ].map((m) => ({
        role: m.role.toLowerCase(),
        content: m.data.text,
      }))

      const intro = `{"type":"Response","text":"`

      // MessageData uses the versionId rather than the agentId
      const responseMessageData: MessageData = {
        fromAgentId: agent.versionId,
        toAgentId: forAgentVersionId === null ? null : forAgentVersionId,
        toApi: forAgentVersionId === null,
        text: intro + `"}`,
      }
      const responseMessage = await MessageInterface.insert(
        agent.agentId,
        agentConversationId,
        MessageRole.ASSISTANT,
        responseMessageData,
      )
      responseMessage.id = responseMessage.messageId.toString()
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
          //  But maybe this isn't needed because ChatGPTRest.relayChatCompletionStream already does 3 retries.
          stop = true
          const error = new Error('Event stream timeout.')
          reject(error)
        }, 10000) // 10 seconds
      }

      startTimeout()

      // Send a /chat/completions call
      ChatGPTRest.relayChatCompletionStream(
        openAiKey,
        agent.model,
        gptMessages,
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

          // todo: check if finish_reason=stop always has an empty delta. Do not send a token update if it does.

          const text = res?.choices[0]?.delta?.content || ''

          buffer += text

          if (buffer.length < intro.length) {
            // The buffer is not long enough to contain the intro.
            return
          }

          const autocompletion = JSON.stringify(parseIncompleteJSON(buffer))

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
