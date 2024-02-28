# RAG with Memory

This project uses a RAG technique to implement long term memory. There is also an implementation for short term memory. Together, these enable a chatbot which only requires a single chat window for interaction. There are no new chats. Users can simply open the app and begin talking.

## Use Cases

A chatbot which runs as a single chat window is useful as a convenience in some cases, and in others, it may be crucial.

### No Chat Management

Some chatbots have the ability to allow users to create new chats. Each chat is independent of the other chats, and this can be useful to prevent the chatbot from getting confused with irrelevant informtion. However, this kind of feature requires the end user to spend time doing chat management. They might have a chat which is dedicated to a certain topic, and they need to dig through past chats to find it. Chat management is a bookkeeping problem.

As a convenience, a chatbot which only requires a single chat window for interaction is useful. Chat management is no longer a concern for the end user. This can be seen as offloading the bookkeeping work to the AI system.

The benefit new chats provide, that is, starting with a fresh context to avoid confusing the bot, can still be achieved with a single chat window. The user could simply say, "Let's change topics", and the memory system will automatically adjust the context appropriately.

### Smart Speakers

For smart speaker devices, there is no UI the user can access to find what they are looking for. Providing a means for interaction in a way that is natural for the user is crucial for enabling the AI with services such as knowledge base management, brainstorming, and providing tailored suggestions.

## Privacy: Open Source and Edge Computing

The ability for long term memory systems in AI to collect user data is a privacy concern. A proprietary system which collects mass amounts of user data over many years could be a gold mine for a company but a privacy nightmare for the user, allowing it to do things such as perform sentiment analysis, ad targeting, health predictions, or imitation.

An option for users of AI to be able to use AI without having to worry about their data being collected is to use an open source AI system which runs on edge devices. This is a system which runs on the user's device, and the user has full control over the data. The AI system is privacy aligned and careful to not send personal information to a server, and the user can see the source code and verify that the AI system is not distributing data.

## Short Term Memory

By giving the chatbot short term memory, limitations imposed by token limit can be overcome. As a comparison, an implemention of a chatbot that uses a sliding context window where past messages are simply truncated causes the bot to forget the beginning of the conversation, leading to innacurate responses. Important instructions established at the beginning of the conversation may be lost, leading the AI to suddenly behave as if it had never received those instructions. 

Here, a sliding window is still used, but truncated messages are summarized into a section of the context window dedicated to the short term memory summary. If we can fine-tune a model to perform short term memory summarization well, then the AI will be able to remember the important details or instructions of the conversation, even if the messages where those details were initally introduced have been truncated.

## Long Term Memory

To support features such as knowledge base management, a long term memory system is needed. This is a system which can remember information from past conversations and use that information to inform future conversations.

The RAG technique is used to implement long term memory. All user inputs are annotated with vector embeddings, and then when a new user input is received, a section in the context window dedicated to long term memory is updated with relevant information. This section is then used to inform the AI's response.

## Chat Iteration

A single chat iteration is a loop starting with the user inputing a new message, and ending with the AI outputing a response.

When a new message is sent to the chatbot, it will:
1. Store in chat logs
2. Prepare the context window
3. Generate a response

A background process will eventually annotate the newly stored chat message with vector embeddings, so that long term retrieval will have eventual access.

![Context Segmentation](/docs/context-segmentation.png)

![RAG with Memory](/docs/rag-with-memory.png)
