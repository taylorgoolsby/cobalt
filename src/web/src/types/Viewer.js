// @flow

import type { User } from './User.js'
import type { Agency } from './Agency.js'

export type Viewer = {
  id?: string,
  currentUser?: User,
  agency?: Agency,
}
