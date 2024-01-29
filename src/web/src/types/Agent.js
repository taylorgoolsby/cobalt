// @flow

import type { Instruction } from './Instruction.js'

export type Agent = {|
  agentId?: number,
  versionId?: number,
  agencyId?: number,
  name?: string,
  model?: string,
  orderIndex?: number,
  isManager?: boolean,
  isDeleted?: boolean,
  dateUpdated?: string,
  dateCreated?: string,

  id?: string,
  referenceId?: number,
  instructions?: Array<Instruction>,
|}
