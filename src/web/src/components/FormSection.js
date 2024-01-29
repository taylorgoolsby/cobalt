// @flow

import type { Node, AbstractComponent } from 'react'
import React from 'react'
import { css } from 'goober'
import Colors from '../Colors.js'
import View from './View.js'
import classnames from 'classnames'

const styles = {
  container: css`
    align-items: stretch;

    h1,
    h2,
    h3 {
      margin-bottom: 0;
      white-space: nowrap;
    }
  `,
  wrapper: css`
    border-left: 1px solid ${Colors.blackSoft};
    margin-top: 8px;
    padding-left: 16px;
    align-items: stretch;
  `,
}

type FormSectionProps = {|
  className?: string,
  label: string,
  labelTag?: string,
  children: Node,
|}

const FormSection: AbstractComponent<FormSectionProps, any> = (
  props: FormSectionProps,
) => {
  const { className, label, labelTag, children } = props

  const Tag = labelTag

  return (
    <View className={classnames(className, styles.container)}>
      {Tag ? <Tag>{label}</Tag> : label}
      <View className={styles.wrapper}>{children}</View>
    </View>
  )
}

export default FormSection
