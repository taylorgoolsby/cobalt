// @flow

import gql from 'graphql-tag'
import * as CreateAccount from './CreateAccountResolver.js'
import * as CreateAgency from './CreateAgencyResolver.js'
import * as CreateAgent from './CreateAgentResolver.js'
import * as CreateAuthToken from './CreateAuthTokenResolver.js'
import * as DeleteAgency from './DeleteAgencyResolver.js'
import * as DeleteAgent from './DeleteAgentResolver.js'
import * as DeleteAuthToken from './DeleteAuthTokenResolver.js'
import * as GetDemoExample from './GetDemoExampleResolver.js'
import * as GetDemoSessionToken from './GetDemoSessionTokenResolver.js'
import * as MergeAccounts from './MergeAccountsResolver.js'
import * as SendMfaCode from './SendMfaCodeResolver.js'
import * as TestOpenAiKey from './TestOpenAiKeyResolver.js'
import * as UpdateAgency from './UpdateAgencyResolver.js'
import * as UpdateAgent from './UpdateAgentResolver.js'
import * as UpdateSettings from './UpdateSettingsResolver.js'
import * as VerifyMfaCode from './VerifyMfaCodeResolver.js'
import * as VerifyPassword from './VerifyPasswordResolver.js'

export const typeDefs: any = gql`
  ${CreateAccount.typeDefs}
  ${CreateAgency.typeDefs}
  ${CreateAgent.typeDefs}
  ${CreateAuthToken.typeDefs}
  ${DeleteAgency.typeDefs}
  ${DeleteAgent.typeDefs}
  ${DeleteAuthToken.typeDefs}
  ${GetDemoExample.typeDefs}
  ${GetDemoSessionToken.typeDefs}
  ${MergeAccounts.typeDefs}
  ${SendMfaCode.typeDefs}
  ${TestOpenAiKey.typeDefs}
  ${UpdateAgency.typeDefs}
  ${UpdateAgent.typeDefs}
  ${UpdateSettings.typeDefs}
  ${VerifyMfaCode.typeDefs}
  ${VerifyPassword.typeDefs}

  type Mutation {
    createAccount(input: CreateAccountInput!): CreateAccountResponse!
    createAgency(input: CreateAgencyInput!): CreateAgencyResponse!
    createAgent(input: CreateAgentInput!): CreateAgentResponse!
    createAuthToken(input: CreateAuthTokenInput!): CreateAuthTokenResponse!
    deleteAgency(input: DeleteAgencyInput!): DeleteAgencyResponse!
    deleteAgent(input: DeleteAgentInput!): DeleteAgentResponse!
    deleteAuthToken(input: DeleteAuthTokenInput!): DeleteAuthTokenResponse!
    getDemoExample(input: GetDemoExampleInput!): GetDemoExampleResponse!
    getDemoSessionToken(
      input: GetDemoSessionTokenInput!
    ): GetDemoSessionTokenResponse!
    mergeAccounts(input: MergeAccountsInput!): MergeAccountsResponse!
    sendMfaCode(input: SendMfaCodeInput!): SendMfaCodeResponse!
    testOpenAiKey(input: TestOpenAiKeyInput!): TestOpenAiKeyResponse!
    updateAgency(input: UpdateAgencyInput!): UpdateAgencyResponse!
    updateAgent(input: UpdateAgentInput!): UpdateAgentResponse!
    updateSettings(input: UpdateSettingsInput!): UpdateSettingsResponse!
    verifyMfaCode(input: VerifyMfaCodeInput!): VerifyMfaCodeResponse!
    verifyPassword(input: VerifyPasswordInput!): VerifyPasswordResponse!
  }
`

export const resolvers: any = {
  Mutation: {
    createAccount: CreateAccount.resolver,
    createAgency: CreateAgency.resolver,
    createAgent: CreateAgent.resolver,
    createAuthToken: CreateAuthToken.resolver,
    deleteAgency: DeleteAgency.resolver,
    deleteAgent: DeleteAgent.resolver,
    deleteAuthToken: DeleteAuthToken.resolver,
    getDemoExample: GetDemoExample.resolver,
    getDemoSessionToken: GetDemoSessionToken.resolver,
    mergeAccounts: MergeAccounts.resolver,
    sendMfaCode: SendMfaCode.resolver,
    testOpenAiKey: TestOpenAiKey.resolver,
    updateAgency: UpdateAgency.resolver,
    updateAgent: UpdateAgent.resolver,
    updateSettings: UpdateSettings.resolver,
    verifyMfaCode: VerifyMfaCode.resolver,
    verifyPassword: VerifyPassword.resolver,
  },
}
