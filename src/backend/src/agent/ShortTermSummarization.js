// @flow

import type {
  ChatCompletionsResponse,
  GPTMessage,
} from '../rest/InferenceRest.js'
import InferenceRest from '../rest/InferenceRest.js'
import type { ModelConfig, UserSQL } from '../schema/User/UserSchema.js'
import type { MessageSQL } from '../schema/Message/MessageSchema.js'
import ShortTermMemoryInterface from '../schema/ShortTermMemory/ShortTermMemoryInterface.js'
import { encode } from 'gpt-tokenizer'

const SHORT_TERM_SUMMARY_TOKEN_SIZE = (2048 * 1.5) / 7
// The number of tokens for a single short term memory completion call:
const SHORT_TERM_COMPLETION_TOKEN_LIMIT = 2048 - SHORT_TERM_SUMMARY_TOKEN_SIZE

/*
Example 1:

input:
```
user: I'm hungry. What is there to eat?

assistant: Your fridge has ingredients to make a sandwich or a salad.

user: I don't want either. Who is open for take out?

assistant: There is a pizza place and a Chinese restaurant open.

previous summary: You are hungry and trying to find something to eat, and your fridge has ingredients to make a sandwich or a salad.
```

output:
```
We are looking for something to eat. At home you could make a sandwich or salad, but you don't want those. Outside, pizza or Chinese are options.
```

Example 2:

input:
```
user: I'm hungry. What is there to eat?

assistant: Your fridge has ingredients to make a sandwich or a salad.

user: I don't want either. Who is open for take out?

assistant: There is a pizza place and a Chinese restaurant open.

user: I don't want pizza or Chinese. I want something else.

assistant: There's Thai, but they don't do take out.

previous summary: We are looking for something to eat. At home you could make a sandwich or salad, but you don't want those. Outside, pizza or Chinese are options.
```

output:
```
We are looking for something to eat. At home you could make a sandwich or salad, but you don't want those. Outside, pizza or Chinese are options. But you don't want those either. I suggested Thai, but they don't do take out.
```
*
*/

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
    agencyConversationId: string,
    allMessages: Array<MessageSQL>,
  ): Promise<string> {
    if (allMessages.length < 2) return ''

    const previousMessages = allMessages.slice(0, allMessages.length - 1)

    // const lastMessage = allMessages[allMessages.length - 1]

    const previousSummary =
      (await ShortTermMemoryInterface.getLast(agencyConversationId)) ?? 'N/A'

    const systemMessage = `You are tasked with summarizing short-term memory dialogue. After each user interaction, update the summary to reflect all relevant information, including new developments, while retaining critical details such as the main topic, specific instructions, and key conditions. Summaries should evolve slowly, ensuring continuity and coherence. Your goal is to produce concise, updated summaries after each exchange. Here's how to approach it:

1. Read the entire dialogue history and the provided previous summary.
2. Identify new information added in the latest interaction.
3. Merge this new information with the previous summary, ensuring that essential details are preserved and the narrative flows logically.
4. Summarize in a way that reflects the progression of the dialogue, retaining focus on the main task, key instructions, and any boundary conditions mentioned.

Examples:

Input 1:
    User: "Let's plan a trip to Japan. We need to decide on cities to visit."
    Assistant: "Tokyo and Kyoto are must-visits for their unique blend of history and modernity."
    Previous summary: "Planning a trip to Japan, deciding on cities."
Output 1: "Planning a trip to Japan, focusing on cities like Tokyo and Kyoto for their historical and modern aspects."

Input 2:
    User: "What about activities? I want something unique."
    Assistant: "In Tokyo, you can experience a traditional tea ceremony. Kyoto offers beautiful temple tours."
    Previous summary: "Planning a trip to Japan, focusing on cities like Tokyo and Kyoto for their historical and modern aspects."
Output 2: "Planning a trip to Japan, visiting Tokyo and Kyoto. Unique activities include a tea ceremony in Tokyo and temple tours in Kyoto."
`

    let input = ''

    const nonSystemMessages = previousMessages.filter(
      (m) => m.role.toLowerCase() !== 'system',
    )

    for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
      console.log('i', i)
      const m = nonSystemMessages[i]
      const nextInput = `${m.role.toLowerCase()}: ${m.data.text}\n\n` + input
      const tokens = encode(
        systemMessage + nextInput + `previous summary: ${previousSummary}`,
        'gpt-3.5-turbo',
      )
      if (SHORT_TERM_COMPLETION_TOKEN_LIMIT < tokens.length) {
        break
      }
      input = nextInput
    }

    // Finally, the previous summary should be in the input string:
    input += `previous summary: ${previousSummary}` // don't forget to update token counting

    const context = [
      {
        role: 'system',
        content: systemMessage,
      },
      {
        role: 'user',
        content: input,
      },
    ]

    // console.log('context', context)

    const response = await InferenceRest.chatCompletion(user, model, context)
    const nextSummary = response.choices[0]?.message?.content ?? ''

    await ShortTermMemoryInterface.insert(
      agencyConversationId,
      model.title,
      context,
      nextSummary,
    )

    return nextSummary
  }
}
