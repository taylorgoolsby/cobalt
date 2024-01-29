// @flow

import engine from 'store-esm/src/store-engine.js'
// import localStorage from 'store-esm/storages/localStorage.js'
// import cookieStorage from 'store-esm/storages/cookieStorage.js'
import sessionStorage from 'store-esm/storages/sessionStorage.js'
import memoryStorage from 'store-esm/storages/memoryStorage.js'
import storeDefaults from 'store-esm/plugins/defaults.js'

type BrowserStore = {
  set: (string, any) => void,
  get: (string) => void,
  remove: (string) => void,
  clearAll: () => void,
}

const storages = [
  // localStorage,
  // cookieStorage,
  sessionStorage,
  memoryStorage,
]
const plugins = [storeDefaults]
const browserStore: BrowserStore = engine.createStore(storages, plugins)

export default browserStore
