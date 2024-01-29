// @flow

import * as qss from 'qss'

export default function getUrlParams(): { [string]: any } {
  if (window.location.search) {
    const params = qss.decode(window.location.search.slice(1))
    return params
  } else {
    return {}
  }
}
