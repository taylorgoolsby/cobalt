# Message Management

This is a UI for building and managing multiagent AI.

There are multiple agents which will be talking to each other.
Each agent maintains its own context as a list of messages which are included with every chat completions API call to OpenAI.

## Spec

* While the end user is interacting with the agency, a single agent, designated as the manager, will handle all communications with the end user via our third-party API.
* When the end user sends a message through our third-party API, the manager receives the message.
* Later, the manager may send a message back to the end user via our third-party API.
* The manager is responsible for forwarding messages to the other agents in the agency, and coordinating the other agents in order to reach a consensus on what to send back to the end user.
* Besides the above details, the manager is an agent just like any other agent in the agency.
* When a new conversation is started with the agency, a conversation is started with each individual agent in the agency.
* A conversation with an agent is a list of messages which are included in the OpenAI chat completions API call for that agent.
* Each agent's conversation starts with a system message which contains all the principles and instructions the agent should follow, and also a list of all the other agents in the agency.
* Each item in the list of agents is formatted as an ID number and a name. For example, `#143 (programmer)`, or `#224 (designer)`, or `#3543 (tester)`, or `#4522 (manager)`.
* Each agent is also instructed to respond in JSON format. The response is a JSON containing a "to" key whose value of type number and is the ID number. The name is not included. The response JSON also has a "context" key whose value is of type string and is the agent's response. This is how the agent will generate a response and designate who the response is for.
* A JSON response with a "to" field equal to `0` is a response to the end user.
* A JSON response with a "to" field equal to any other number is a response to the agent with that ID number.

## Database Spec

* For a given agency, there may be multiple conversations.
* For a given conversation, there may be multiple messages.
* A given message is not only associated with the conversationId, but also the agentId.

## Database Schema

* Message
  * messageId
  * conversationId
  * agentId
  * role (system, assistant, user)
  * linkedMessageId (null if not linked to another message)
  * data
    * from (null if from API otherwise agentId)
    * to (null if to API, otherwise agentId)
    * text
  * dateCreated

## API Spec

* POST /api/agency/:agencyId/chat/completions
  * messages: Array<{role: string, content: string}>
    * Creates a model response for the given chat conversation.
    * If a message with system role is included, then the system message is appended to the system message we generate for the manager. This is similar to how custom instructions in ChatGPT work.
    * The system message we generate is private and will not be exposed through the API, but your custom system message will be echoed back.
