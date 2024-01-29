// @flow

import type { AbstractComponent } from 'react'
import {
  MjmlAll,
  MjmlAttributes,
  MjmlClass,
  MjmlColumn,
  MjmlHead,
  MjmlSection,
  MjmlStyle,
  MjmlText,
  MjmlTitle,
} from 'mjml-react'
import React from 'react'

const css = String.raw

type Props = {|
  title: string,
|}

const SectionName: AbstractComponent<Props, any> = (props: Props) => {
  const { title } = props

  return (
    <MjmlSection padding-top="20px" padding-bottom="10px">
      <MjmlColumn>
        <MjmlText align="left" font-size="22px">
          {title}
        </MjmlText>
      </MjmlColumn>
    </MjmlSection>
  )
}

export default SectionName
