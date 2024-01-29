// @flow

import { v6 as uuidv6, v4 as uuidv4, v5 as uuidv5 } from 'uuid-with-v6'
import crypto from 'crypto'
// import { encode } from 'url-safe-base64'

const NAMESPACE = '8dc079dd-0313-4563-864f-008eb45af87f'

function getUnique(): string {
  const id = uuidv6()
  return id.replace(/-/g, '').toUpperCase()
}

function getRandom(): string {
  const id = uuidv4()
  return id.replace(/-/g, '').toUpperCase()
}

function getHashed(name: string | number): string {
  const id = uuidv5(name.toString(), NAMESPACE)
  return id.replace(/-/g, '').toUpperCase()
}

function generateAuthKey(): string {
  const key = crypto.randomBytes(32).toString('base64')
  return key
}

export default {
  getUnique,
  getRandom,
  getHashed,
  generateAuthKey,
}
