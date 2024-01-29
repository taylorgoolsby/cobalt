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
  code: string,
}

export default class MfaCodeEmail
  implements EmailTemplate<SubjectProps, BodyProps>
{
  async buildSubject(props: SubjectProps): Promise<string> {
    return 'Account Verification'
  }

  async buildHtml(props: BodyProps): Promise<string> {
    const { code } = props
    const appName = Config.appName

    const { html, errors } = render(
      <Mjml>
        <StandardHeader title={'Email Verification'} />
        <StandardLayout
          title={'Email Verification'}
          message={'To verify your email address, enter the code below.'}
          code={code}
        />
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
