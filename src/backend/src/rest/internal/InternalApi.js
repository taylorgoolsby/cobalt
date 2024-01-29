// @flow

import type { ApiGroup } from '../apiTypes.js'
import ProjectCreationApi from './ProjectCreationApi.js'
import type { SessionToken } from '../../utils/Token.js'
import InternalChatApi from './InternalChatApi.js'

const InternalApi: ApiGroup<SessionToken> = {}

function registerApi(api: ApiGroup<SessionToken>) {
  for (const key of Object.keys(api)) {
    let endpoint = key
    if (!endpoint.startsWith('/')) {
      endpoint = '/' + endpoint
    }

    if (!InternalApi[endpoint]) {
      InternalApi[endpoint] = api[key]
    } else {
      throw new Error(
        `Name Conflict: Internal API endpoint named ${endpoint} has already been registered.`,
      )
    }
  }
}

registerApi(ProjectCreationApi)
registerApi(InternalChatApi)

export default InternalApi
