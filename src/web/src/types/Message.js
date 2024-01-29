// @flow

export const MessageRole = {
  SYSTEM: 'SYSTEM',
  ASSISTANT: 'ASSISTANT',
  USER: 'USER',
}

export type MessageRoleType = $Keys<typeof MessageRole>

export type MessageData = {|
  internalInstruction?: ?boolean,
  userInstruction?: ?boolean,
  correctionInstruction?: ?boolean,
  toApi?: ?boolean,
  fromApi?: ?boolean,
  completed?: ?boolean,
  toAgentId?: ?number,
  fromAgentId?: ?number,
  text: string,

  id?: string,
|}

export type Message = {
  messageId?: number,
  agentId?: number,
  agentConversationId?: string,
  role?: MessageRoleType,
  linkedMessageId?: ?number,
  data?: MessageData,
  dateCreated?: string,

  id?: string,
  __typename?: string,
}

export type FlatMessage = {|
  messageId: number,
  agentId: number,
  agentConversationId: string,
  role: MessageRoleType,
  linkedMessageId: ?number,

  internalInstruction?: ?boolean,
  userInstruction?: ?boolean,
  correctionInstruction?: ?boolean,
  toApi?: ?boolean,
  fromApi?: ?boolean,
  completed?: ?boolean,
  toAgentId?: ?number,
  fromAgentId?: ?number,
  text: string,

  dateCreated: string,

  __typename?: string,
  id?: string,
|}
