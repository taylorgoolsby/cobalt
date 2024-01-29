# Initial Schema Scope

This is a SaaS app which is a simple UI for managing and building multiagent AI systems.

Here is a rough outline of the how the app works technically:

1. (Creating AI Agencies) There is a UI which allows end users to:
  1. Create a new multiagent AI environment. This could also be called a multiagent organization or a commune.
  2. Within an organization, multiple agents can be defined.
  3. Each agent runs on ChatGPT.
  3. Each agent has a unique name within the organization for identification purposes and referencing.
  4. Each agent has custom instructions which is a string of text to be given to the agent when it first starts up. It is the first string of text the agent will see for this instance of conversation.
  5. The custom instructions contains rules about how the agent should respond to certain inputs. These rules might inform the agent to check the FROM directive and react a certain way depending on which other agent sent them the message, and who to send a message to in response using the TO directive.
  6. To encode rules about how agents are to interact with each other, the custom instructions contains rules about how the agent's response should be formatted. Each output should start with a TO directive. For example, "TO Programmer:". Our system will read the TO directive, which contains the unique identifier of the other agent the message is to be forwarded to, and our system will forward the message from the first agent to the TO agent. The forwarded message will start with a FROM directive which informs the agent receiving the forwarded message where the message came from. This is how the agents will know who they are talking to.
  7. Defining the custom instruction might be like an ad lib to make things easier for the end user to define agent rules. For example, "When <message is from X>, <do something> and <send response to Y>". The custom instruction will be parsed and converted into the proper format for the agent to understand.
2. (Publishing AI Agencies) Once an organization is created, it can be published to the public. This will make the organization available to other users to interact with via API.
  1. Each organization was given a unique identifier when it was created. This is used for creating unique API endpoints for each organization. For example: https://multiagent.ai/organizations/12345
  2. This is meant to be a drop-in replacement for existing integrations with ChatGPT. If you have a SaaS built on top of the ChatGPT API which uses a single agent approach for your app's operation, then using this multiagent management solution, you can define a multiagent organization with multiple agents, and then publish the organization to the public. This will create a new API endpoint for your organization which will be a drop-in replacement for your existing ChatGPT API endpoint. The only difference is that the new API endpoint will be a multiagent endpoint. Third-party apps which access the API cannot tell the difference between a single agent endpoint and a multiagent endpoint.
  3. When a new conversation is started via API to a multiagent organization, new instances of the agents defined in the organization will be created. Each agent will be given the custom instructions defined in the organization. The agents will then interact with each other according to the rules defined in the custom instructions.
  4. There will always be an agent in every organization which handles the interfacing between the API and the rest of the organization. This agent is like a manager, forwarding requests from the API to the other agents in the organization. This agent is also responsible for sending responses back to the API. This agent is the only agent which has access to the API. The other agents in the organization do not have access to the API. It handles unpacking a request to multiple agents and also packing multiple responses from multiple agents into a single response to the API.
  5. Access to this API is private. An `Authorization` header is required to gain access. This is the same as the ChatGPT API. If the end user has a SaaS that is intended to be a public API, then they are expected to build a wrapper API, which is public, around the private API so that they can monitor usage and charge for usage.
  6. The API is a REST API. It is a drop-in replacement for the ChatGPT API. The only difference is that the API is multiagent. The API is not a GraphQL API. The API is not a Websocket API. The API is not a gRPC API. The API is not a JSON-RPC API.

## GraphQL Schema

The GraphQL schema is used as a schema management solution. The MySQL tables are able to be generated from it (using the @sql directive to inform which types and fields should be converted into tables and columns), and all data from the database passes through it, so it can redact sensitive information (using the @private directive to inform which fields should be redacted before being sent to the client).

The GraphQL schema is also used to generate the TypeScript types for the client and server.

The GraphQL schema is also used to generate the API documentation.

The GraphQL schema may also used to generate the API tests using AI to generate end to end tests from the schema later down the road.

For this project specifically, here are the types and fields needed:

- User
  - id
  - email
  - password
  - openAIKey
- Agency
  - id
  - versionId (shared between organizations after restructuring)
  - userId
  - name
- Agent
  - id
  - agencyId
  - name
- Instructions
  - id
  - agentId
- Block
  - id
  - instructionId
  - type
  - data
- Conversation
  - id
  - agentId
- Message
  - id
  - conversationId
  - data
    - from (null if from API otherwise agentId)
    - to (null if to API, otherwise agentId)
    - text
  - timestamp
- AuthKey
  - id
  - agencyId
  - name (user defined name such as dev or prod)
  - key (encrypted at rest)
  - deletedAt
  - createdAt
  - expiresAt
