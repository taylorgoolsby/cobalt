// @flow

import type {
  ChatCompletionsResponse,
  GPTMessage,
} from '../rest/InferenceRest.js'
import InferenceRest from '../rest/InferenceRest.js'
import type { ModelConfig, UserSQL } from '../schema/User/UserSchema.js'
import type { MessageSQL } from '../schema/Message/MessageSchema.js'

export default class ShortTermSummarization {
  static async performCompletion(
    user: UserSQL,
    model: ModelConfig,
    messages: Array<MessageSQL>,
  ): Promise<string> {
    if (!messages.length) return ''

    let input = ''

    const nonSystemMessages = messages.filter(
      (m) => m.role.toLowerCase() !== 'system',
    )
    for (const m of nonSystemMessages) {
      input += `${m.role.toLowerCase()}: ${m.data.text}\n\n`
    }

    const context = [
      {
        role: 'system',
        content: `You are a helpful assistant.

You will be given a list of messages between the user and the assistant. Your task is to summarize the conversation into a single message. The summary should be a single message that captures the essence of the conversation. It should be a concise and accurate summary of the conversation, and should be written in a clear and understandable manner.

Example 1:

input:
\`\`\`
user: Can you please solve this equation for x? 2x + 5 = 11

assistant: Sure, I can help you with that. To isolate the variable x, we need to subtract 5 from both sides of the equation and then divide by 2. This gives us: 2x = 6, x = 3. The solution is x = 3. Is there anything else you need help with?
\`\`\`

output:
\`\`\`
We are solving a math equation. The equation is 2x + 5 = 11, and we are solving for x. The solution I found was x = 3.
\`\`\`

Example:

input:
\`\`\`
user: hi

assistant: Hello! How can I help you today?
\`\`\`

output:
\`\`\`
We are greeting each other. You said "hi" and I said "Hello! How can I help you today?"
\`\`\`
`,
      },
      {
        role: 'user',
        content: input,
      },
    ]

    console.log('short term summarization context', context)

    const response = await InferenceRest.chatCompletion(user, model, context)
    console.log('response.choices', response.choices)
    const content = response.choices[0]?.message?.content ?? ''
    return content + '\n\n'
  }
}
