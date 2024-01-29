// @flow

import { v4 as uuid } from '@lukeed/uuid'

function getRandom(): string {
  const id = uuid()
  return id.replace(/-/g, '').toUpperCase()
}

export default {
  getRandom,
}
