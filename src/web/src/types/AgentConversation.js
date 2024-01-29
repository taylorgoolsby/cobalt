// @flow

import type { Message } from './Message.js'

export type AgentConversation = {
  agentConversationId?: string,
  agencyConversationId?: string,
  agentId?: number,
  name?: string,
  isDeleted?: boolean,
  dateUpdated?: string,
  dateCreated?: string,

  id?: string,
  messages?: Array<Message>,
}
