// @flow

import ID from '../utils/ID.js'

export type Instruction = {|
  instructionId?: string,
  agentId?: number,
  clause?: string,
  orderIndex?: number,
  canEdit?: boolean,
  isDeleted?: boolean,
  dateUpdated?: string,
  dateCreated?: string,
|}

export function createInstruction(
  agentId: number,
  clause: string,
  // orderIndex: number,
): Instruction {
  return {
    instructionId: ID.getRandom(),
    agentId,
    clause,
    orderIndex: 0,
    isDeleted: false,
    dateUpdated: new Date().toISOString(),
    dateCreated: new Date().toISOString(),
  }
}
