// @flow

import type { AbstractComponent } from 'react'
import React, { forwardRef, useRef, useState } from 'react'
import { css } from 'goober'
import classnames from 'classnames'
import Colors from '../Colors.js'
import { PiXBold, PiCaretLeftBold } from 'react-icons/pi'
import Spinner from './Spinner.js'

export const buttonTransition: string = css`
  cursor: pointer;
  opacity: 1;
  transition: opacity 280ms;
  &:active:not([disabled='']):not([disabled='true']) {
    transition: opacity 0ms;
    opacity: 0.3;
  }
`

export const activeClassTransition: string = css`
  cursor: pointer;
  opacity: 1;
  transition: opacity 280ms;
  &.active:not([disabled='']):not([disabled='true']) {
    transition: opacity 0ms;
    opacity: 0.3;
  }
`

export const buttonStyles: any = {
  button: css`
    position: relative;
    display: block;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    text-align: start;
    touch-action: manipulation;

    &[disabled=''],
    &[disabled='true'] {
      cursor: default;
    }
  `,
  buttonSquared: css`
    width: 188px;
    border: 1px solid ${Colors.blackSoft};
    border-radius: 4px;
    padding: 8px 16px;
    height: 40px;
    font-size: 16px;
    color: ${Colors.black};
    text-align: center;
    background-color: white;

    &[data-primary='true'] {
      background-color: ${Colors.blue};
      color: ${Colors.white};
    }

    &[data-secondary='true'] {
      background-color: ${Colors.grey};
    }

    &[data-small='true'] {
      padding: 4px 8px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      height: 26px;
      width: unset;
    }

    &:hover:not([disabled='']):not([disabled='true']):not([data-small='true']) {
      border: 1px solid ${Colors.black};
    }

    &[disabled=''],
    &[disabled='true'] {
      opacity: 0.5;
    }

    &[data-spinning='true'] {
      color: transparent;

      > *:not(.spinner) {
        opacity: 0;

        * {
          opacity: 0;
        }
      }
    }
  `,
  emphasis: css`
    &:not([disabled='']):not([disabled='true']) {
      background-color: ${Colors.linkBg};
      color: ${Colors.link};
      border: 1px solid ${Colors.linkBg};

      &:hover {
        border: 1px solid ${Colors.link};
      }
    }
  `,
  danger: css`
    border: 1px solid ${Colors.redSoft};
    color: ${Colors.red};

    &:hover:not([disabled='']):not([disabled='true']) {
      border: 1px solid ${Colors.red};
    }
  `,
  closeButton: css`
    position: absolute;
    top: 0;
    right: 0;
    outline: none;
    height: 60px;
    width: 60px;
    display: flex;
    justify-content: center;
    align-items: center;

    svg {
      color: black;
      font-size: 22px;
    }
  `,
  backButton: css`
    position: absolute;
    top: 0;
    left: 0;
    outline: none;
    height: 60px;
    width: 60px;
    display: flex;
    justify-content: center;
    align-items: center;

    svg {
      color: black;
      font-size: 22px;
    }
  `,
}

type ButtonProps = {|
  className?: ?string,
  style?: any,
  type?: string,
  children: any,
  onClick?: ?(e: any) => any,
  disabled?: boolean,
  allowPropagation?: boolean,
  onPointerDown?: ?(e: any) => any,
  onPointerUp?: ?(e: any) => any,
  onPointerEnter?: ?(e: any) => any,

  // This is needed because of clickable blocks inside the button.
  // When a child element is clicked, it receives :active,
  // but even though event.stopPropagation() is used,
  // the parent still receives :active.
  useActiveClass?: boolean,
|}

export const Button: any = forwardRef(
  (props: ButtonProps, forwardedRef: any): any => {
    const {
      className,
      type,
      children,
      onClick,
      disabled,
      allowPropagation,
      useActiveClass,
      onPointerDown,
      onPointerUp,
      onPointerEnter,
      ...rest
    } = props

    const internalRef = useRef() // Step 1: Create the internal ref

    // Step 3: Assign the ref using a callback
    const setRefs = (element: any) => {
      internalRef.current = element

      // If a ref is forwarded, update its current value
      if (typeof forwardedRef === 'function') {
        forwardedRef(element)
      } else if (forwardedRef) {
        forwardedRef.current = element
      }
    }

    function handlePointerDown(event: any) {
      if (onPointerDown) onPointerDown(event)
      if (internalRef.current) {
        internalRef.current.classList.add('active')
      }
    }

    function handlePointerUp(event: any) {
      if (onPointerUp) onPointerUp(event)
      if (internalRef.current) {
        internalRef.current.classList.remove('active')
      }
    }

    return (
      <button
        ref={setRefs}
        type={type || 'button'}
        className={classnames(className, buttonStyles.button, {
          [buttonTransition]: !useActiveClass,
          [activeClassTransition]: useActiveClass,
        })}
        onClick={(e) => {
          if (disabled) {
            return
          }
          if (!allowPropagation) {
            e.stopPropagation()
          }
          if (onClick) {
            onClick(e)
          }
        }}
        disabled={disabled}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerEnter={onPointerEnter}
        {...(rest: any)}
      >
        {children}
      </button>
    )
  },
)

type ButtonSquaredProps = {|
  ...ButtonProps,
  primary?: boolean,
  secondary?: boolean,
  small?: boolean,
|}

export const ButtonSquared: AbstractComponent<ButtonSquaredProps, any> = (
  props: ButtonSquaredProps,
) => {
  const {
    children,
    className,
    disabled,
    primary,
    secondary,
    small,
    onClick,
    ...rest
  } = props

  const [spinning, setSpinning] = useState(false)

  function handleClick(e: any) {
    if (!onClick) return

    const res = onClick(e)
    if (res instanceof Promise) {
      setSpinning(true)
      res.then(() => {
        setSpinning(false)
      })
    }
  }

  return (
    <Button
      className={classnames(className, buttonStyles.buttonSquared)}
      disabled={!!disabled || spinning}
      data-primary={primary}
      data-secondary={secondary}
      data-small={small}
      data-spinning={spinning}
      onClick={handleClick}
      {...(rest: any)}
    >
      {children}
      {spinning ? (
        <Spinner
          className={'spinner'}
          primary={primary}
          small={small}
          buttonSpinner
        />
      ) : null}
    </Button>
  )
}

type CloseButtonProps = {|
  ...ButtonProps,
  children?: any,
|}

export const CloseButton = (props: CloseButtonProps): any => {
  const { className, ...rest } = props
  return (
    <Button
      className={classnames(className, buttonStyles.closeButton)}
      autoFocus={false}
      {...rest}
    >
      <PiXBold />
    </Button>
  )
}

type BackButtonProps = {|
  ...ButtonProps,
  children?: any,
|}

export const BackButton = (props: BackButtonProps): any => {
  const { className, ...rest } = props
  return (
    <Button
      className={classnames(className, buttonStyles.backButton)}
      autoFocus={false}
      {...rest}
    >
      <PiCaretLeftBold />
    </Button>
  )
}

export default Button
