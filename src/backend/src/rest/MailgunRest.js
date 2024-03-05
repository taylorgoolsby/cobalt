// @flow

import axios from 'axios'
import Config from 'common/src/Config.js'
import AdminEmail from '../email/templates/AdminEmail.js'

export interface EmailTemplate<S, B> {
  buildSubject(props: S): Promise<string>;
  buildHtml(props: B): Promise<string>;
}

export default class MailgunRest {
  static async buildAndSend<S, B>(
    template: EmailTemplate<S, B>,
    to: Array<string>,
    subjectProps: S,
    bodyProps: B,
  ) {
    const subject = await template.buildSubject(subjectProps)
    const body = await template.buildHtml(bodyProps)
    await send(to, subject, body)
  }

  static async sendEmail(to: Array<string>, subject: string, html: string) {
    await send(to, subject, html)
  }

  static async sendAdminNotification(message: string) {
    const template = new AdminEmail()
    const subject = await template.buildSubject({})
    const body = await template.buildHtml({ message })
    await send([Config.adminEmail], subject, body)
  }
}

async function send(to: Array<string>, subject: string, html: string) {
  const headers = {
    Authorization:
      'Basic ' +
      Buffer.from(`api:${Config.mailgunKey}`, 'utf-8').toString('base64'),
  }
  const url = `https://api.mailgun.net/v3/${Config.mailgunDomain}/messages`
  const from = `cobalt.online <${Config.emailFromAddress}>`

  let envTag = ''
  if (!Config.isProd) {
    envTag = ` [${Config.env}]`
  }

  const data = {
    from,
    to: to.join(','),
    subject: `${subject}${envTag}`,
    html,
  }

  const formData = new FormData()
  for (const key of Object.keys(data)) {
    formData.append(key, data[key])
  }

  try {
    const res = await axios.post(
      `https://api.mailgun.net/v3/${Config.mailgunDomain}/messages`,
      formData,
      {
        headers,
      },
    )
    console.log('res?.data', res?.data)
  } catch (err) {
    console.error(err)
  }
}
