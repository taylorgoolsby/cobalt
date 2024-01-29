// @flow

import React from 'react'
import Markdown from 'markdown-to-jsx'
import { css } from 'goober'
import Contact from './Contact.js'
import Colors from '../Colors.js'
import MarkdownCodeExamples from './MarkdownCodeExamples.js'
import Prism from 'prismjs'
import View from './View.js'
import classnames from 'classnames'
import MessageLoadingIndicator from './MessageLoadingIndicator.js'
import TryExample from './TryExample.js'

const styles = {
  md: css`
    width: 100%;

    p {
      font-size: 16px;
      line-height: 1.6;
    }

    ul,
    ol {
      padding-right: 40px;
    }

    strong {
      color: ${Colors.orange};
    }

    pre {
      white-space: pre-wrap;
    }

    /* background and framing for both blocks and inline code */
    :not(pre) > code[class*='language-'],
    pre[class*='language-'] {
      border-radius: 4px;
    }

    /* code blocks */
    code[class*='language-'],
    pre[class*='language-'] {
      font-size: 16px;
      font-family: 'Sometype Mono', monospace;
      word-wrap: anywhere;
      white-space: pre-wrap;
    }

    code[class*='language-'] {
      display: inline-block;
      font-size: 16px;
      font-family: 'Sometype Mono', monospace;
    }

    pre[class*='language-'] {
      overflow-y: scroll;
      max-height: 500px;
      margin: 0;
    }

    .line-numbers .line-numbers-rows {
      border-right: none;
    }

    /* inline code */
    :not(pre) > code[class*='language-'] {
      padding: 0 4px;
      margin: 0 0.1em;
      font-size: 16px;
      line-height: 1.6;
      display: inline;
    }

    > p:first-child {
      margin-top: 0;
    }

    > p:last-child {
      margin-bottom: 0;
    }

    table {
      border: 1px solid ${Colors.blackSoft};
      border-radius: 4px;
      border-spacing: 0;
      width: 100%;
      font-size: 14px;

      /*th, td {
        border: 1px solid ${Colors.blackSoft};
      }*/

      /* Apply a border to the right of all but the last column */
      th:not(:last-child),
      td:not(:last-child) {
        border-right: 1px solid ${Colors.blackSoft};
      }

      /* Apply a border to the bottom of all but the last row */
      > thead > tr > th,
      > thead > tr > td,
      > tbody > tr:not(:last-child) > th,
      > tbody > tr:not(:last-child) > td,
      > tfoot > tr:not(:last-child) > th,
      > tfoot > tr:not(:last-child) > td,
      > tr:not(:last-child) > td,
      > tr:not(:last-child) > th,
      > thead:not(:last-child),
      > tbody:not(:last-child),
      > tfoot:not(:last-child) {
        border-bottom: 1px solid ${Colors.blackSoft};
      }

      td,
      th {
        padding: 8px 16px;
        text-align: left;
      }
    }
  `,
}

const A = (props: any) => {
  return <a {...props} target="_blank" />
}

const Code = (props: any): any => {
  function handleRef(el: any) {
    if (el) {
      Prism.highlightElement(el)
    }
  }

  return <code ref={handleRef} {...props} />
}

type MarkdownTextProps = {
  className?: ?string,
  // If you use custom React components in your markdown, you can pass props to them here.
  // Example:
  //  <MarkdownText props={{'prop-id': {className: 'example-class'}}}>
  //    {'<CustomComponent propId="prop-id">'}
  //  </MarkdownText>
  // The MarkdownText component will lookup the props and pass them to the custom component.
  lookupProps?: {
    [propId: string]: { [string]: any },
  },
  children?: any,
}

const MarkdownText = (props: MarkdownTextProps): any => {
  const { className, lookupProps, children, ...rest } = props

  return (
    <Markdown
      className={classnames(className, styles.md)}
      {...(rest: any)}
      options={{
        forceWrapper: true,
        overrides: {
          a: {
            component: A,
          },
          code: {
            component: Code,
          },
          Contact: {
            component: Contact,
          },
          TryExample: {
            component: (p) => {
              const props: any = lookupProps?.[p.propId] ?? {}
              return <TryExample {...props} />
            },
          },
          MarkdownCodeExamples: {
            component: (p) => {
              const props: any = lookupProps?.[p.propId] ?? {}
              return <MarkdownCodeExamples {...props} />
            },
          },
          MessageLoadingIndicator: {
            component: MessageLoadingIndicator,
          },
        },
      }}
    >
      {children}
    </Markdown>
  )
}

export default MarkdownText
