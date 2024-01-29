// @flow

import callingCodeData, {
  allCallingCodes,
  geographicCallingCodes,
} from 'calling-code-data'
import { isValidPhoneNumber } from 'libphonenumber-js'

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
