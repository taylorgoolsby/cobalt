// @flow

import { getName } from 'country-list'

export default class Country {
  static getName(countryCode2: string): string {
    // Although 2-letter identifiers for these places exist, these are not technically 3166 codes:
    if (countryCode2 === 'EU') {
      return 'European Union'
    } else if (countryCode2 === 'UN') {
      return 'United Nations'
    }

    // Missing 3166 data:
    if (countryCode2 === 'AC') {
      return 'Ascension Island'
    }
    if (countryCode2 === 'XK') {
      return 'Kosovo'
    }

    // Better naming:
    if (countryCode2 === 'SX') {
      return 'Sint Maarten'
    }

    return getName(countryCode2) || ''
  }
}
