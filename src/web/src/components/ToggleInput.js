// @flow

import type { AbstractComponent } from 'react'
import React, { useEffect, useRef, useState } from 'react'
import { css } from 'goober'
import classnames from 'classnames'
import Colors from '../Colors.js'

const styles = {
  container: css`
    position: relative;
    display: inline-block;
    width: 60px;
    height: 30px;

    input:checked + div {
      background-color: ${Colors.green};
    }

    input:checked + div:before {
      transform: translateX(29px);
    }

    &[data-disabled='true'] {
      opacity: 0.5;
      pointer-events: none;
      cursor: default;
    }
  `,
  input: css`
    opacity: 0;
    width: 0;
    height: 0;
  `,
  background: css`
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${Colors.controlBg};
    transition: 0.3s;
    border-radius: 30px;

    &:before {
      position: absolute;
      content: '';
      height: 25px;
      width: 25px;
      left: 3px;
      bottom: 2.6px;
      background-color: #fff;
      border-radius: 50%;
      transition: 0.3s;
    }
  `,
  foreground: css``,
}

export type ToggleInputProps = {|
  className?: string,
  value?: ?boolean,
  onChange?: ?(value: boolean) => void,
  disabled?: ?boolean,
|}

const ToggleInput: AbstractComponent<ToggleInputProps, any> = (
  props: ToggleInputProps,
) => {
  const { className, value, onChange, disabled } = props

  const [checked, setChecked] = useState(false)
  const inputRef: any = useRef(null)

  const usedValue = value ?? checked

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.checked = usedValue
    }
  }, [usedValue])

  function handleChange(e: any) {
    if (disabled) return

    setChecked(!usedValue)
    if (onChange) onChange(!usedValue)
  }

  return (
    <div
      className={classnames(styles.container, className)}
      data-disabled={!!disabled}
    >
      <input
        ref={inputRef}
        className={styles.input}
        type={'checkbox'}
        checked={usedValue}
        onChange={handleChange}
        disabled={disabled}
      />
      <div className={styles.background} onClick={handleChange} />
    </div>
  )
}

export default ToggleInput
