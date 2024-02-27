// @flow

import type { EmailTemplate } from './MailgunRest.js'
import MailgunRest from './MailgunRest.js'
import PostmarkRest from './PostmarkRest.js'
import Config from 'common/src/Config.js'

// We use Mailgun for dev, and Postmark for prod.

export default class Email {
  static async buildAndSend<S, B>(
    template: EmailTemplate<S, B>,
    to: Array<string>,
    subjectProps: S,
    bodyProps: B,
  ) {
    if (Config.isProd && Config.postmarkKey && Config.emailFromAddress) {
      await PostmarkRest.buildAndSend(template, to, subjectProps, bodyProps)
    } else if (
      Config.mailgunKey &&
      Config.mailgunDomain &&
      Config.emailFromAddress
    ) {
      await MailgunRest.buildAndSend(template, to, subjectProps, bodyProps)
    } else {
      console.error('Email service environment variables are not configured.')
    }
  }

  static async sendAdminNotification(message: string) {
    await MailgunRest.sendAdminNotification(message)
  }
}
