// @flow

import callingCodeData, {
  allCallingCodes,
  geographicCallingCodes,
} from 'calling-code-data'
import { getExampleNumber, isValidPhoneNumber } from 'libphonenumber-js'
import examples from 'libphonenumber-js/mobile/examples'
import Country from './Country.js'
import { IMask } from 'react-imask'

export default class Phone {
  static allCallingCodes: Array<string> = allCallingCodes
  static geographicCallingCodes: Array<string> = geographicCallingCodes

  static getCountryCodes(callingCode: string): Array<string> {
    if (callingCode.startsWith('+')) {
      callingCode = callingCode.slice(1)
    }

    const countryCodes = callingCodeData[callingCode]
    if (!countryCodes) {
      throw new Error(`Calling code ${callingCode} doesn't have data.`)
    }

    return countryCodes
  }

  static getCallingCodeName(
    callingCode: string,
    countryCode?: ?string,
  ): string {
    countryCode = countryCode || Phone.getCountryCodes(callingCode)[0]

    if (countryCode === '-') {
      return 'Unassigned'
    }
    if (countryCode === '**') {
      return 'Non-Geographic Services'
    }

    return Country.getName(countryCode)
  }

  static formatCallingCode(callingCode: string, countryCode?: ?string): string {
    if (callingCode.startsWith('1')) {
      return `+1 ${callingCode.slice(1)}`.trim()
    }
    return `+${callingCode}`
  }

  /*
    Uses imask https://imask.js.org/guide.html#masked-pattern
  * */
  static getMask(callingCode: string, countryCode?: ?string): string {
    // UN:
    if (callingCode === '888') {
      return '+{888} ### #### ####'
    }

    countryCode = countryCode || Phone.getCountryCodes(callingCode)[0]
    if (countryCode === '-') {
      return `+{${callingCode}} [#### #### ####]`
    }
    if (countryCode === '**') {
      return `+{${callingCode}} [#### #### ####]`
    }

    // For both RU and KZ, they return example international numbers which only have +7 as the calling code.
    // There is no way to get +76 or +77 examples at this time, but it may change soon because KZ is trying to
    // change to +77.
    // If Google's libphonenumber updates and one day returns a two digit calling code starting with 7,
    // then the following implementation would break.
    // To fix it, it should follow a similar algorithm to how NANP numbers are parsed.
    // For NANP numbers, AKA numbers that start with +1 as the calling code,
    // there are some NANP members which are not US or CA, so the example number obtained for them
    // includes the 3 digit NPA. For example, the example for AS is +1 684 733 1234.
    // The full international calling code for AS is 1684, but Google will report only 1 as the calling code.
    // So this algorithm must check if the callingCode is NANP, and if it is, then it is used as the callingCodeExample.

    const phoneNumber = getExampleNumber(countryCode, examples)
    if (!phoneNumber) {
      console.error('missing example for', callingCode, countryCode)
      return `+{${callingCode}} [#### #### ####]`
    }

    const isNanp = callingCode.startsWith('1')

    const internationalExample = phoneNumber.formatInternational()
    const callingCodeExample = isNanp
      ? callingCode
      : phoneNumber.countryCallingCode

    let count = 0
    const remainder = internationalExample
      .replaceAll(/\d/g, (match, offset, string, groups) => {
        const digit = callingCodeExample[count]
        count++
        if (digit) {
          return ''
        } else {
          return string[offset] // no change
        }
      })
      .replaceAll(/[^0-9 ]/g, '')
      .trim()

    const formattedCallingCode = Phone.formatCallingCode(callingCode)
    const mask = `+{${formattedCallingCode.slice(1)}} ${remainder.replaceAll(
      /[0-9]/g,
      '#',
    )}`

    const escapedMask = mask.replace(/0/g, '\\0')

    return escapedMask
  }

  static format(
    callingCode: ?string,
    phoneNumber: ?string, // The complete number, including calling code
    countryCode?: ?string,
  ): string {
    if (!callingCode) return phoneNumber || ''
    if (!phoneNumber) return phoneNumber || ''

    const mask = Phone.getMask(callingCode, countryCode)
    const maskInstance = new IMask.MaskedPattern({
      mask,
      definitions: {
        '#': /[0-9•]/,
      },
    })
    maskInstance.unmaskedValue = phoneNumber
    return maskInstance.value
  }

  static isValid(
    callingCode: ?string,
    phoneNumber: ?string, // The complete number, including calling code
    countryCode?: ?string,
  ): boolean {
    if (!callingCode) return false
    if (!phoneNumber) return false

    countryCode = countryCode || Phone.getCountryCodes(callingCode)[0]

    return isValidPhoneNumber(phoneNumber, countryCode)
  }
}
