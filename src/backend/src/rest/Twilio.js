// @flow

import twilio from 'twilio'
import Config from 'common/src/Config.js'

const client = twilio(Config.twilioSid, Config.twilioAuthToken)

export default class Twilio {
  static async sendSms(to: string, body: string): Promise<any> {
    if (!to.startsWith('+')) {
      to = '+' + to
    }

    const res = await client.messages.create({
      body,
      from: Config.twilioFromNumber,
      to,
    })
    console.info('sent sms', res.to?.slice(-4), res.body)
    if (res.errorMessage || res.errorCode) {
      console.error('res.errorMessage', res.errorMessage)
      console.error('res.errorCode', res.errorCode)
    }
  }
}
