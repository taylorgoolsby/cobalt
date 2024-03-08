# Cobalt

This is an AI project which combines a RAG-like technique with memory management. Together, these enable a chatbot which only requires a single chat window for interaction. There are no new chats. Users can simply open the app and begin talking.

## Use Cases

**Cobalt** is a privacy-first digital assistant.

It can help you with a wide range of tasks, such as:

* Journaling.
* Knowledge base management.
* Brainstorming.

It is a chatbot which runs as a single chat window. It runs locally on your device, and does not send any data to a server. It can connect to a language model running locally on your machine through LM Studio or ollama.

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

# Installation

This project was built and tested on MacOS with Apple Silicon. It should work on other platforms, but it has not been tested. This project uses Node.js, MySQL, and Faiss. If you are using MacOS, this project should automatically install mysql for you using homebrew if you haven't already. If you are using another platform, you will need to install a MySQL server and start it locally yourself.

1. Download the source code from the GitHub repository.
2. `cd cobalt`
3. `yarn install`
4. `npm start`

This will start the backend services. The express server will run on localhost:4000 and mysql on localhost:3306.

You will then need to start the frontend web server:

1. `cd src/web`
2. `npm start`
