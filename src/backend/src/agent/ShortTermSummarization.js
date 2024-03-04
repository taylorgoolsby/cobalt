// @flow

import type {
  ChatCompletionsResponse,
  GPTMessage,
} from '../rest/InferenceRest.js'
import InferenceRest from '../rest/InferenceRest.js'
import type { ModelConfig, UserSQL } from '../schema/User/UserSchema.js'
import type { MessageSQL } from '../schema/Message/MessageSchema.js'

export default class ShortTermSummarization {
  /*
  When a user enters a new message, the length of that message is variable,
  and it might cause multiple messages to be truncated, starting with the oldest.
  This function takes the truncated messages, the last prompt, and the previous short term summary,
  and it generates a new short term summary which incorporates the information lost by the truncated messages.
  It tries to preserve as much information in the previous short term summary as possible,
  prioritizing the most important points.
  This means short term memory should change slowly over time, and should not change much with each new message.

  Sometimes the last message is too long. We are restricted by context windows size,
  so the last message must fit within an assigned quota of tokens.
   forthe last message is small enough to fit within, then it can be placed as is into the context,
  and this might be the best option.
  But when the last message is too long, instead of placing it as into the context,
  it must instead be summarized into a single message which is true to the original.
  Any information lost by this "last message summarization" step might be able to be incorporated into
  the "short term summarization" step.

  Last message summarization happens before short term memory summarization.
  Usually, the last message is short.
  But sometimes people might have a long last message in events like pasting in a long body of text.
  The summarization might say something like, "You pasted a long body of text which was about XYZ",
  but all the information in that text was lost.
  Instead, what we need to do make the AI run in a different mode.
  The usualy mode of operation is to perform a completion on a context which has sections dedicated to
  long term memory, short term memory, the last message, and space for generation.
  This mode is useful for natural conversation, journaling, knowledge base management, etc,
  but it is not good for tasks where the user pastes in a large body of text.
  So we need to run in a different mode where the AI generates over a context window which does not have any
  long term memory. Perhaps it might be useful to still include short term memory because important instruction
  from the beginning of the conversation might need to be present.
  If including short term memory is still not enough space to include the large body of text as is,
  then the short term memory is severely summarized into just a single sentence capturing the most important instruction.
  It is often the case that for tasks like this, the user gives a single instruction at the beginning of the conversation,
  so this should be useful.
  This is the maximum amount of space we can give towards generating a response which solves a task given a large body of text.
  If this is still not enough space, we just throw an error and say, "Your message is too long".

  We might be able to even process these cases where the message is too long by performing another kind of summarization.
  This summarization picks out the most important pieces of information from the large body of text.
  It's kind of like principle component analysis, but its done using NLP.
  This is probably not suitable for coding tasks, but it might be useful for other tasks.

  For document search tasks, there is a better solution than PCA-like summarization.
  Instead, a RAG-like solution would perform better because it would be able to search all information
  rather than just the most important information.
  */
  static async performCompletion(
    user: UserSQL,
    model: ModelConfig,
    truncatedMessages: Array<MessageSQL>,
    lastPrompt: MessageSQL,
    previousSummary: string,
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
