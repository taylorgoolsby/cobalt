// @flow

import { DateTime } from 'luxon'

export default class Time {
  static fromISO(isoTime: string): string {
    return DateTime.fromISO(isoTime).toLocaleString(
      DateTime.DATETIME_SHORT_WITH_SECONDS,
    )
  }
}
