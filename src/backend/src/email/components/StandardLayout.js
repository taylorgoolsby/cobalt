// @flow

import type { AbstractComponent } from 'react'
import {
  MjmlAll,
  MjmlAttributes,
  MjmlBody,
  MjmlButton,
  MjmlClass,
  MjmlColumn,
  MjmlHead,
  MjmlImage,
  MjmlSection,
  MjmlStyle,
  MjmlText,
  MjmlTitle,
  MjmlWrapper,
} from 'mjml-react'
import React from 'react'
import Colors from '../Colors.js'
import Config from 'common/src/Config.js'

const css = String.raw

type Props = {|
  title: string,
  message: string,
  code?: string,
  primaryLabel?: string,
  primaryLink?: string,
|}

const StandardLayout: AbstractComponent<Props, any> = (props: Props) => {
  const { title, message, code, primaryLabel, primaryLink } = props

  return (
    <MjmlBody background-color={Colors.panelBg}>
      <MjmlWrapper padding="11px" background-color={Colors.panelBg}>
        <MjmlSection>
          <MjmlColumn
            padding-left="11px"
            padding-right="11px"
            padding-top="11px"
            padding-bottom="10px"
          >
            <MjmlImage
              align="left"
              border-radius="4px"
              width="34px"
              height="34px"
              src="https://cobalt-public-assets.s3.us-east-2.amazonaws.com/a-g-square.png"
              href={Config.webHost}
            />
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection padding-left="10px" padding-right="10px">
          <MjmlColumn
            background-color={Colors.panelBg}
            border-radius="4px"
            border="1px solid white"
            padding-top="10px"
            padding-bottom="10px"
          >
            <MjmlText align="left" font-size="22px">
              {title}
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection
          padding-left="11px"
          padding-right="11px"
          padding-top="40px"
          padding-bottom="0px"
        >
          <MjmlColumn>
            <MjmlText align="left" font-size="16px">
              {message}
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection
          padding-left="10px"
          padding-right="10px"
          padding-top="40px"
          padding-bottom="30px"
        >
          <MjmlColumn>
            {primaryLabel && primaryLink ? (
              <MjmlButton
                background-color="#83a9e6"
                color="white"
                href={primaryLink}
                padding="0 0 0 0"
                font-weight="400"
                font-size="16px"
                font-family=""
              >
                {primaryLabel}
              </MjmlButton>
            ) : null}
            {code ? (
              <MjmlText align="center" font-size="22px">
                {code}
              </MjmlText>
            ) : null}
          </MjmlColumn>
        </MjmlSection>
      </MjmlWrapper>
    </MjmlBody>
  )
}

export default StandardLayout
