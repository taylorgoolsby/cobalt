// @flow

import type { AbstractComponent } from 'react'
import {
  MjmlAll,
  MjmlAttributes,
  MjmlClass,
  MjmlFont,
  MjmlHead,
  MjmlSection,
  MjmlStyle,
  MjmlText,
  MjmlTitle,
} from 'mjml-react'
import React from 'react'
import Colors from '../Colors.js'

const css = String.raw

type Props = {|
  title: string,
|}

const StandardHeader: AbstractComponent<Props, any> = (props: Props) => {
  const { title } = props

  return (
    <MjmlHead>
      <MjmlFont
        name="Montserrat"
        href="https://fonts.googleapis.com/css2?family=Montserrat"
      />
      <MjmlAttributes>
        <MjmlAll padding="0px"></MjmlAll>
        <MjmlText
          font-family="Montserrat, Verdana, sans-serif"
          padding="0 25px"
          font-size="13px"
        ></MjmlText>
        <MjmlSection background-color="#ffffff"></MjmlSection>
      </MjmlAttributes>
      <MjmlStyle inline="inline">
        {css`
          html {
            background-color: white;
          }

          a {
            font-family: Montserrat, Verdana, sans-serif;
          }

          /*a, a:visited {
            text-decoration: none !important;
            color: inherit !important;
          }*/
        `}
      </MjmlStyle>
      <MjmlTitle>{title}</MjmlTitle>
    </MjmlHead>
  )
}

export default StandardHeader
