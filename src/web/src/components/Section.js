// @flow

import React from 'react'
import { css } from 'goober'

const styles = {
  section: css``,
  item: css`
    display: block;
  `,
}

type SectionProps = {
  children: any,
}

const Section = (props: SectionProps): any => {
  const { children, ...rest } = props

  const _children = Array.isArray(children) ? children : [children]

  return (
    <section className={styles.section} {...(rest: any)}>
      {_children.map((child, i) => (
        <div key={i} className={styles.item}>
          {child}
        </div>
      ))}
    </section>
  )
}

export default Section
