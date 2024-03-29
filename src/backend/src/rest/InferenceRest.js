// @flow

import axios from 'axios'
import parseAxiosError from '../utils/parseAxiosError.js'
import Config from 'common/src/Config.js'
import type { ModelConfig, UserSQL } from '../schema/User/UserSchema.js'

export type GPTMessage = {
  role: string,
  content: string,
}

export type ChatCompletionsResponse = {
  id: string,
  choices: Array<{
    index: number,
    delta?: {
      content: string,
      tool_calls: Array<{
        id: string,
        type: string,
        function: {
          name: string,
          arguments: string,
        },
      }>,
      role: string,
    },
    message?: {
      content: string,
      tool_calls: Array<{
        id: string,
        type: string,
        function: {
          name: string,
          arguments: string,
        },
      }>,
      role: string,
    },
    finish_reason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null,
  }>,
  created: number,
  model: string,
  system_fingerprint: string,
  object: string,
  usage?: {
    completion_tokens: number,
    prompt_tokens: number,
    total_tokens: number,
  },
}

// ordering matters here
// default model is the first one.
export const standardModels = [
  'gpt-3.5-turbo-1106',
  'gpt-4-1106-preview',
  // 'gpt-3.5-turbo',
  // 'gpt-4',
]

export default class InferenceRest {
  static async getAvailableModels(authToken: ?string): Promise<Array<string>> {
    if (!authToken) return []

    if (authToken === Config.openAiPublicTrialKey) {
      return ['gpt-3.5-turbo-1106']
    }

    const res = await send(
      'GET',
      'https://api.openai.com/v1/models',
      null,
      authToken,
    )
    const list = res.data
    // const filteredList = list.filter((model) => {
    //   return standardModels.includes(model.id)
    // })
    const filteredList = standardModels.filter((model) => {
      return list.some((m) => m.id === model)
    })
    // const modelNames = filteredList.map((model) => model.id)
    return filteredList
  }

  static async getBestChatModel(authToken: ?string): Promise<?string> {
    if (!authToken) return null

    const res = await send(
      'GET',
      'https://api.openai.com/v1/models',
      null,
      authToken,
    )
    const list = res.data
    const gpt_4_32k = list.find((model) => model.id === 'gpt-4-32k')
    const gpt_4 = list.find((model) => model.id === 'gpt-4-32k')
    const gpt_35_turbo_16k = list.find(
      (model) => model.id === 'gpt-3.5-turbo-16k',
    )
    const gpt_35_turbo = list.find((model) => model.id === 'gpt-3.5-turbo')
    return (
      gpt_4_32k?.id || gpt_4?.id || gpt_35_turbo_16k?.id || gpt_35_turbo?.id
    )
  }

  static async getDefaultChatModel(authToken: ?string): Promise<?string> {
    if (!authToken) return null

    const res = await send(
      'GET',
      'https://api.openai.com/v1/models',
      null,
      authToken,
    )
    const list = res.data
    // const gpt_4_32k = list.find((model) => model.id === 'gpt-4-32k')
    const gpt_4 = list.find((model) => model.id === 'gpt-4-32k')
    // const gpt_35_turbo_16k = list.find((model) => model.id === 'gpt-3.5-turbo-16k')
    const gpt_35_turbo = list.find((model) => model.id === 'gpt-3.5-turbo')
    return gpt_35_turbo?.id || gpt_4?.id
  }

  static relayChatCompletionStream(
    user: UserSQL,
    model: ModelConfig,
    messages: Array<GPTMessage>,
    onData: (data: ChatCompletionsResponse) => any,
    onError?: (err?: ?Error) => any,
  ): void {
    const apiBase = model.apiBase
    const apiKey = model.apiKey

    if (!apiBase) {
      throw new Error('apiBase is required')
    }

    // const responseFormat = canUseJSON(model)
    //   ? {
    //       type: options?.responseFormat ?? 'json_object',
    //     }
    //   : {
    //       type: options?.responseFormat || 'text',
    //     }

    // console.debug('GPT', messages[messages.length - 1])

    let buffer = ''

    let dataLog = []

    // console.debug('start openai relay')

    let headers = {}
    if (apiKey) {
      headers = {
        Authorization: `Bearer ${apiKey}`,
      }
    }

    // todo: As long as completionOptions is configured by the end user,
    //  it should be safe to pass them through without checking what they are.
    const data: any = model.completionOptions ?? {}
    data.messages = messages
    data.stream = true

    makeRequestWithRetry(
      () =>
        axios({
          method: 'POST',
          url: `${apiBase}/v1/chat/completions`,
          headers,
          data,
          responseType: 'stream',
          timeout: 10000,
        })
          .then((response) => {
            response.data.on('data', (chunk) => {
              const data = chunk.toString()

              if (data === undefined) return

              dataLog.push(data)

              buffer += data

              const items = buffer.split('\n\n')

              for (let i = 0; i < items.length; i++) {
                let item = items[i]

                // item might end with 0, 1, or 2 new lines.
                // So the next item might start with 2, 1, or 0 new lines.
                // Remove any newlines at the beginning:
                item = item.replace(/^\n+/, '')

                if (item === '') continue

                if (/^data: \[DONE\]/.test(item)) {
                  buffer = items.slice(i + 1).join('\n\n')
                  return
                }

                let parsedPayload
                try {
                  parsedPayload = JSON.parse(item.replace(/^data: /, ''))
                } catch (err) {
                  buffer = items.slice(i).join('\n\n')
                  return
                }

                try {
                  onData(parsedPayload)
                } catch (err) {
                  console.error(err)
                }
              }
              // All items in the array have been processed, so clear the buffer.
              // Equivalent to items.slice(items.length).join('\n\n')
              buffer = ''
            })
            response.data.on('end', () => {
              // console.log('closed third party')
              if (buffer) {
                console.debug(dataLog)
                console.debug(buffer)
                console.error(new Error('buffer is not empty'))
              }
            })
          })
          .catch((err) => {
            // parseAxiosError will throw when a connection cannot be established.
            const data = parseAxiosError(err)
            data.on('data', (chunk) => {
              // This will sometimes return incomplete JSON error objects.
              // The connection might also close before the rest of the JSON comes in.
              // So we print the error here, but it is useless outside of this function,
              // so onError is called with no args.
              const errorChunk = chunk.toString()
              try {
                const parsed = JSON.parse(errorChunk)
                if (onError && parsed?.error?.message)
                  onError(new Error(parsed?.error?.message))
                else if (onError) onError()
              } catch (err) {
                console.error(errorChunk)
                if (onError) onError()
              }
            })
            // data.on('end', () => {
            // console.log('closed third party')
            // })
          }),
      3,
    ).catch((err) => {
      console.error(err)
    })
  }

  static async chatCompletion(
    user: UserSQL,
    model: ModelConfig,
    messages: Array<GPTMessage>,
  ): Promise<ChatCompletionsResponse> {
    const apiBase = model.apiBase
    const apiKey = model.apiKey

    if (!apiBase) {
      throw new Error('apiBase is required')
    }

    // const responseFormat = canUseJSON(model)
    //   ? {
    //       type: options?.responseFormat ?? 'json_object',
    //     }
    //   : {
    //       type: options?.responseFormat || 'text',
    //     }

    // console.debug('GPT', messages[messages.length - 1])

    // todo: As long as completionOptions is configured by the end user,
    //  it should be safe to pass them through without checking what they are.
    const data: any = model.completionOptions ?? {}
    data.messages = messages
    data.stream = false

    const res = await send(
      'POST',
      `${apiBase}/v1/chat/completions`,
      data,
      apiKey,
    )

    if (res.error) {
      if (res.error instanceof Error) {
        throw res.error
      } else {
        throw new Error(res.error)
      }
    }

    return res
  }
}

function makeRequestWithRetry(
  call: () => Promise<any>,
  retries: number,
): Promise<any> {
  console.log('retries', retries)
  return call().catch((error) => {
    console.error(error.message)
    if (retries > 0) {
      console.log(`Retrying... Attempts left: ${retries - 1}`)
      return makeRequestWithRetry(call, retries - 1)
    }
    return Promise.reject(error)
  })
}

async function send(
  method: 'GET' | 'POST',
  url: string,
  data: ?{ [string]: any },
  authToken: ?string,
): any {
  const config: { url: string, headers?: { ... }, ... } = {
    method: method.toLowerCase(),
    url,
  }

  if (authToken) {
    config.headers = {
      Authorization: `Bearer ${authToken}`,
    }
  }

  if (method === 'GET') {
    // $FlowFixMe
    config.params = data
  } else if (method === 'POST') {
    // $FlowFixMe
    config.data = data
  }

  // console.debug(
  //   `Sending ${method} request to ${url}`,
  // )

  // $FlowFixMe
  config.timeout = 10000

  const res = await makeRequestWithRetry(
    () =>
      axios(config)
        .then((response) => {
          return response.data
        })
        .catch((err) => {
          // parseAxiosError will throw when a connection cannot be established.
          return parseAxiosError(err)
        })
        .then((response) => {
          if (response.error) {
            throw new Error(response.error.message)
          } else {
            return response
          }
        }),
    3,
  ).catch((err) => {
    console.error(err)
    return {
      error: err,
    }
  })
  return res
}

export function canUseJSON(model: string): boolean {
  return model === 'gpt-4-1106-preview' || model === 'gpt-3.5-turbo-1106'
}
