// @flow

import Config from '../Config.js'
import sessionStore from '../stores/SessionStore.js'

export async function post(
  url: string,
  body: { [string]: any },
  headers?: { [string]: any },
): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    // $FlowFixMe
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body ?? {}),
  })
  if (res.ok) {
    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('text')) {
      const data = await res.text()
      return data
    } else {
      const data = await res.json()
      return data
    }
  } else {
    let errorMessage = res.statusText
    try {
      const contentType = res.headers.get('content-type') ?? ''
      if (contentType.includes('text')) {
        const data = await res.text()
        errorMessage = data
      } else {
        const data = await res.json()
        errorMessage = data.error
      }
    } catch (err) {}
    throw new Error(errorMessage)
  }
}

export async function postInternal(
  endpoint: string,
  body: { [string]: any },
  options?: {
    noAuthorization?: boolean,
  },
): Promise<{ [string]: any }> {
  const fullUrl = `${Config.backendHost}/service${endpoint}`
  const headers = {
    Authorization: !!options?.noAuthorization
      ? null
      : `Basic ${sessionStore.sessionToken ?? ''}`,
    'Content-Type': 'application/json',
  }
  return post(fullUrl, body, headers)
}
