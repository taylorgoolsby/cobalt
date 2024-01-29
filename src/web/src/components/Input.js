// @flow

import type { AbstractComponent } from 'react'
import React, { forwardRef, useEffect, useRef, useState } from 'react'
import { css } from 'goober'
import classnames from 'classnames'
import { useIMask, IMaskInput } from 'react-imask'

const styles = {
  input: css`
    min-width: 0;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    color: inherit;
    border: none;
    outline: none;
    padding: 0 0;
    letter-spacing: normal;
    background-color: transparent;

    &::placeholder {
      color: black;
      opacity: 0.5;
    }

    &[disabled=''],
    &[disabled='true'] {
      opacity: 0.5;
    }
  `,
  textarea: css`
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    color: inherit;
    border: none;
    outline: none;
    resize: none;
    margin-top: 0;
    margin-bottom: 0;
    padding: 0 0;
    background-color: transparent;
    box-sizing: border-box;

    &::placeholder {
      color: black;
      opacity: 0.5;
    }

    &[disabled=''],
    &[disabled='true'] {
      opacity: 0.5;
    }
  `,
}

type InputProps = {
  placeholder?: ?string,
  value?: ?string,
  initialValue?: ?string,
  className?: ?string,
  style?: ?{ ... },
  type?: ?string,
  onInput?: ?(e: any) => any,
  onKeyDown?: ?(e: any) => any,
  onEnterPress?: ?(e: any) => any,
  disabled?: ?boolean,
  // how can the maxLength be defined in one place, but then enforced on both backend and front-end?
  maxLength?: ?number,
  multiline?: ?boolean,
  onFocus?: ?(e: any) => void,
  onBlur?: ?(e: any) => void,
  mask?: any,
  autoFocus?: boolean,
}

const Input: AbstractComponent<InputProps, any> = forwardRef(
  (props: InputProps, ref: any): any => {
    const {
      placeholder,
      value,
      initialValue,
      className,
      style,
      type,
      onInput,
      onKeyDown,
      onEnterPress,
      disabled,
      maxLength,
      multiline,
      onFocus,
      onBlur,
      mask,
      autoFocus,
      ...rest
    } = props

    const internalRef: any = useRef(null)

    useEffect(() => {
      if (internalRef?.current) {
        if (autoFocus) {
          setTimeout(() => {
            internalRef?.current?.focus()
          })
        }
      }
    }, [internalRef?.current])

    function handleRef(el: ?HTMLElement) {
      if (ref) {
        ref.current = el
      }
      internalRef.current = el
    }

    function textAreaAdjust(e: any) {
      const el = e.target
      el.style.height = '1px'
      el.style.height = el.scrollHeight + 'px'

      if (onInput) onInput(e)
    }

    function handleAccept(value: any, mask: any) {
      if (onInput)
        onInput({
          target: {
            value,
          },
        })
    }

    function handleMaskedInput(e: any) {
      if (onInput)
        onInput({
          target: {
            value: e.target.value.replaceAll(/[^0-9]/g, ''),
          },
        })
    }

    function handleInput(e: any) {
      if (onInput) onInput(e)
    }

    if (multiline) {
      return (
        <textarea
          ref={handleRef}
          className={classnames(className, styles.textarea)}
          style={style}
          placeholder={placeholder}
          defaultValue={initialValue}
          onInput={textAreaAdjust}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              // e.preventDefault()
              if (onEnterPress) onEnterPress(e)
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              e.target?.blur()
            }
            if (onKeyDown) onKeyDown(e)
          }}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          // rows={!value ? 1 : null}
          rows={1}
          onFocus={onFocus}
          onBlur={onBlur}
          autoFocus={autoFocus}
          {...(rest: any)}
        ></textarea>
      )
    } else if (mask) {
      return (
        <IMaskInput
          mask={mask}
          inputRef={handleRef}
          className={classnames(className, styles.input)}
          style={style}
          placeholder={placeholder}
          unmask={true}
          value={value}
          definitions={{
            '#': /[0-9]/,
          }}
          defaultValue={initialValue}
          type={type || 'text'}
          onAccept={handleAccept}
          // onInput={handleMaskedInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              // e.preventDefault()
              if (onEnterPress) onEnterPress()
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              e.target?.blur()
            }
            if (onKeyDown) onKeyDown(e)
          }}
          disabled={disabled}
          maxLength={maxLength}
          onFocus={onFocus}
          onBlur={(e) => {
            if (onBlur) onBlur(e)
            if (!e.defaultPrevented) {
              e.target.scrollTo(0, 0)
            }
          }}
          autoFocus={autoFocus}
          {...(rest: any)}
        />
      )
    } else {
      return (
        <input
          ref={handleRef}
          className={classnames(className, styles.input)}
          style={style}
          placeholder={placeholder}
          value={value}
          defaultValue={initialValue}
          type={type || 'text'}
          onInput={handleInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              // preventDefault needed to prevent error modal from closing if pressing enter causes it to open.
              // todo: this interferes with the ability to submit a form by pressing enter.
              e.preventDefault()
              if (onEnterPress) onEnterPress()
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              e.target?.blur()
            }
            if (onKeyDown) onKeyDown(e)
          }}
          disabled={disabled}
          maxLength={maxLength}
          onFocus={onFocus}
          onBlur={(e) => {
            if (onBlur) onBlur(e)
            if (!e.defaultPrevented) {
              e.target.scrollTo(0, 0)
            }
          }}
          autoFocus={autoFocus}
          {...(rest: any)}
        />
      )
    }
  },
)

export default Input
