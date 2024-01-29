// @flow

import axios from 'axios'
import Config from 'common/src/Config.js'

export interface EmailTemplate<S, B> {
  buildSubject(props: S): Promise<string>;
  buildHtml(props: B): Promise<string>;
}

export default class PostmarkRest {
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
}

async function send(to: Array<string>, subject: string, html: string) {
  const headers = {
    'X-Postmark-Server-Token': Config.postmarkKey,
  }
  const from = `agencyai.gg <${Config.emailFromAddress}>`

  let envTag = ''
  if (!Config.isProd) {
    envTag = ` [${Config.env}]`
  }

  const data = {
    From: from,
    To: to.join(','),
    Subject: `${subject}${envTag}`,
    HtmlBody: html,
  }

  // const formData = new FormData()
  // for (const key of Object.keys(data)) {
  //   formData.append(key, data[key])
  // }

  try {
    const res = await axios.post(`https://api.postmarkapp.com/email`, data, {
      headers,
    })
    console.log('res?.data', res?.data)
  } catch (err) {
    console.error(err)
  }
}
