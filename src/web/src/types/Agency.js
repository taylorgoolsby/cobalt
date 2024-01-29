// @flow

import type { Agent } from './Agent.js'
import type { AgencyConversation } from './AgencyConversation.js'

export type Agency = {
  agencyId?: number,
  versionId?: number,
  lookupId?: string,
  userId?: string,
  name?: string,
  description?: string,
  isPrivate?: boolean,
  isDeleted?: string,
  dateUpdated?: string,
  dateCreated?: string,

  id?: string,
  agents?: Array<Agent>,
  agencyConversation?: ?AgencyConversation,
  debuggingConversations?: Array<AgencyConversation>,
  versions?: Array<Agency>,
}
