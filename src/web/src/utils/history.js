// @flow

import 'history-events'
import { createBrowserHistory } from 'history'
import { makeObservable } from 'mobx'

export type History = {
  location: {
    pathname: string,
  },
  push: Function,
  replace: Function,
  clearSearch: Function,
}

let history: ?History

export function getHistory(): ?History {
  if (history) return history
}

export function makeHistory(): ?History {
  if (history) return history

  history = createBrowserHistory()

  // $FlowFixMe
  history.clearSearch = () => {
    // $FlowFixMe
    history.replace(history.location.pathname)
  }

  makeObservable(history, {
    push: false,
    replace: false,
    clearSearch: false,
  })

  return history
}
