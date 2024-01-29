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
  MjmlImage,
} from 'mjml-react'
import Config from 'common/src/Config.js'
import type { EmailTemplate } from '../../rest/MailgunRest.js'
import StandardHeader from '../components/StandardHeader.js'
import Colors from '../Colors.js'
import StandardLayout from '../components/StandardLayout.js'

const css = String.raw

type SubjectProps = {}

type BodyProps = {
  link: string,
}

export default class NewAccountEmail
  implements EmailTemplate<SubjectProps, BodyProps>
{
  async buildSubject(props: SubjectProps): Promise<string> {
    return 'Complete Account Creation'
  }

  async buildHtml(props: BodyProps): Promise<string> {
    const { link } = props

    const { html, errors } = render(
      <Mjml>
        <StandardHeader title={'New Account'} />
        <StandardLayout
          title={'Account Creation'}
          message={'To complete account creation, click the link below.'}
          primaryLabel={'Verify Sign Up'}
          primaryLink={link}
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
