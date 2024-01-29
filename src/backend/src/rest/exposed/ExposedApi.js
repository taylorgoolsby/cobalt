// @flow

import type { ApiGroup } from '../apiTypes.js'
import ChatApi from './ChatApi.js'
import type { AgencySQL } from '../../schema/Agency/AgencySchema.js'

const ExposedApi: ApiGroup<AgencySQL> = {}

function registerApi(api: ApiGroup<AgencySQL>) {
  for (const key of Object.keys(api)) {
    let endpoint = key
    if (!endpoint.startsWith('/')) {
      endpoint = '/' + endpoint
    }

    if (!ExposedApi[endpoint]) {
      ExposedApi[endpoint] = api[key]
    } else {
      throw new Error(
        `Name Conflict: Exposed API endpoint named ${endpoint} has already been registered.`,
      )
    }
  }
}

registerApi(ChatApi)

export default ExposedApi
