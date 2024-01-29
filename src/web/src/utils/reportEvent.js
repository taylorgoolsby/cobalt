// @flow

import sessionStore from '../stores/SessionStore.js'
import posthog from 'posthog-js'

export default function reportEvent(
  eventName: string,
  properties: { [string]: any },
): void {
  if (sessionStore.appLoaded) {
    if (!!sessionStore.cookieSettings?.performance) {
      posthog.capture(eventName, {
        properties,
      })
    }
  }
}
