// @flow

import bcrypt from 'bcrypt'
import crypto from 'crypto'
import CryptoJS from 'crypto-js'
import { totp } from 'otplib'
import { createMfaToken } from './Token.js'
import Config from 'common/src/Config.js'
import zxcvbn from 'zxcvbn'

const otpSecret = Config.authTokenSecret
totp.options = {
  window: 10,
}

const bcryptRounds = 15

const mfaStore: {
  [code: string]: {
    userId: string,
    email?: ?string,
    phoneCallingCode?: ?string,
    phoneNumber?: ?string,
  },
} = {}

export default class Security {
  static encrypt(plaintext: ?string): ?string {
    if (!plaintext) return null

    // https://github.com/brix/crypto-js/issues/439

    const ciphertext = CryptoJS.AES.encrypt(
      plaintext,
      Config.cipherKey,
    ).toString()
    return ciphertext
  }

  static decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, Config.cipherKey)
    const plaintext = bytes.toString(CryptoJS.enc.Utf8)
    return plaintext
  }

  static genAuthCode(): string {
    const code = crypto.randomBytes(32).toString('base64')
    return code
  }

  static async genMfaCode(data: {
    userId: string,
    email?: ?string,
    phoneCallingCode?: ?string,
    phoneNumber?: ?string,
  }): Promise<string> {
    const token = totp.generate(otpSecret)
    console.debug('generated code', token)
    mfaStore[token] = data
    // todo: clearTimeout
    setTimeout(() => {
      delete mfaStore[token]
    }, 5 * 60 * 1000)
    return token
  }

  static async verifyMfaCode(userId: string, code: string): Promise<string> {
    const isValid = totp.check(code, otpSecret)
    if (!isValid) {
      throw new Error('The code was incorrect or expired.')
    }
    const data = mfaStore[code]
    if (data.userId !== userId) {
      throw new Error('This code was not issued to that userId.')
    }
    return await createMfaToken(data)
  }

  static async hashPassword(plain: string): Promise<string> {
    const { score } = zxcvbn(plain)
    if (score === 0) {
      throw new Error('Password is too weak.')
    }
    const salt = bcrypt.genSaltSync(bcryptRounds)
    const hash = bcrypt.hashSync(plain, salt)
    return hash
  }

  static async checkPassword(plain: string, hash: string): Promise<boolean> {
    const result = bcrypt.compareSync(plain, hash)
    return result
  }
}
