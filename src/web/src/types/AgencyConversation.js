// @flow

import type { AgentConversation } from './AgentConversation.js'

export type AgencyConversation = {
  agencyConversationId?: string,
  agencyId?: number,
  name?: string,
  startedByUserId?: string,
  isDeleted?: boolean,
  dateUpdated?: string,
  dateCreated?: string,

  id?: string,
  managerConversation?: AgentConversation,
  agentConversations?: Array<AgentConversation>,
}
