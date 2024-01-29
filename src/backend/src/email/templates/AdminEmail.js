// @flow

import React from 'react'
import {
  render,
  Mjml,
  MjmlHead,
  MjmlTitle,
  MjmlBody,
  MjmlSection,
  MjmlColumn,
  MjmlButton,
  MjmlAttributes,
  MjmlAll,
  MjmlText,
  MjmlClass,
  MjmlStyle,
} from 'mjml-react'
import Config from 'common/src/Config.js'
import type { EmailTemplate } from '../../rest/MailgunRest.js'
import StandardHeader from '../components/StandardHeader.js'
import SectionName from '../components/SectionName.js'
import StandardLayout from '../components/StandardLayout.js'

const css = String.raw

type SubjectProps = {}

type BodyProps = {
  message: string,
}

export default class AdminEmail
  implements EmailTemplate<SubjectProps, BodyProps>
{
  async buildSubject(props: SubjectProps): Promise<string> {
    return 'Admin Notification'
  }

  async buildHtml(props: BodyProps): Promise<string> {
    const { message } = props

    const { html, errors } = render(
      <Mjml>
        <StandardHeader title={'Admin Notification'} />
        <StandardLayout title={'Admin Notification'} message={message} />
      </Mjml>,
      { validationLevel: 'soft' },
    )

    if (errors?.length) {
      console.log('email errors')
      console.error(errors)
    }

    return html
  }
}
