// @flow

import { DateTime } from 'luxon'

export default class TimeUtils {
  static toSQLfromISO(isoString: string): string {
    return DateTime.fromISO(isoString).toSQL()
  }

  static toISOfromSQL(sqlString: string): string {
    return DateTime.fromSQL(sqlString).toISO()
  }

  static now(): string {
    return DateTime.utc().toISO()
  }

  static startOfCurrentMonth(): string {
    return DateTime.utc().startOf('month').toISO()
  }

  static startOfPrevMonth(): string {
    return DateTime.utc()
      .startOf('month')
      .minus({ days: 1 })
      .startOf('month')
      .toISO()
  }

  static startOfMonth(isoString: string): string {
    return DateTime.fromISO(isoString).startOf('month').toISO()
  }

  static endOfMonth(isoString: string): string {
    return DateTime.fromISO(isoString).endOf('month').toISO()
  }
}
