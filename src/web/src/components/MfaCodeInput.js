// @flow

import type { AbstractComponent } from 'react'
import React, { useEffect, useRef, useState } from 'react'
import { css } from 'goober'
import classnames from 'classnames'
import View from './View.js'
import Colors from '../Colors.js'
import input from './Input.js'

const styles = {
  container: css`
    flex-direction: row;

    @keyframes blinker {
      50% {
        border-left: 1px solid ${Colors.blackSoftest};
        border-right: 1px solid ${Colors.blackSoftest};
      }
    }

    div[data-filled] {
      background-color: white;
      width: 38px;
      height: 46px;
      justify-content: center;
      align-items: center;
      font-size: 18px;
      border: 1px solid ${Colors.blackSoftest};
      border-radius: 5px;
      box-sizing: border-box;
      user-select: none;
    }

    div[data-filled]:not(:last-child) {
      margin-right: 8px;
    }

    &:not([data-valid='true']):not([data-invalid='true']) {
      /*input:focus ~ div[data-filled] {
        animation: blinker 1s step-start infinite reverse;
      }*/

      input:not(:focus) ~ div[data-filled] {
        border-left: 1px solid ${Colors.blackSoftest};
        border-right: 1px solid ${Colors.blackSoftest};
      }

      div[data-selected='false'] {
        border-left: 1px solid ${Colors.blackSoftest};
      }

      div[data-selected='true'] {
        border-left: 1px solid ${Colors.black};
        animation: blinker 1s step-start infinite reverse;
      }

      div[data-selected-next='true'] {
        border-left: 1px solid ${Colors.blackSoftest};
        border-right: 1px solid ${Colors.black};
        animation: blinker 1s step-start infinite reverse;
      }

      div[data-highlighted='true'] {
        background-color: ${Colors.blackSoft};
      }
    }

    &[data-valid='true'] {
      div {
        border: 1px solid ${Colors.blue};
      }
    }

    &[data-invalid='true'] {
      div {
        border: 1px solid ${Colors.red};
      }
    }
  `,
  input: css`
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  `,
}

type MfaCodeInputProps = {|
  className?: ?string,
  onFilled: (code: string) => any,
  isValid: boolean,
  isInvalid: boolean,
  onResetValidity: (e: any) => any,
|}

const MfaCodeInput: AbstractComponent<MfaCodeInputProps> = (
  props: MfaCodeInputProps,
) => {
  const { className, onFilled, isValid, isInvalid, onResetValidity } = props

  const [code, setCode] = useState('')
  const [selectionStart, setSelectionStart] = useState(0)
  const [selectionEnd, setSelectionEnd] = useState(0)
  const [selectNextEdge, setSelectNextEdge] = useState(false)
  const inputRef: any = useRef(null)

  useEffect(() => {
    if (inputRef?.current) {
      setTimeout(() => {
        inputRef?.current.focus()
      })
    }
  }, [inputRef?.current])

  function handleRef(el: any) {
    inputRef.current = el
  }

  function handleInput(e: any) {
    if (isValid) {
      e.target.value = code
      return
    }
    if (isInvalid) {
      if (onResetValidity) onResetValidity()
    }
    e.target.value = e.target.value.replace(/[^0-9]/g, '')
    const nextCode = e.target.value.slice(0, 6)
    setCode(nextCode)
    if (nextCode.length === 6) {
      if (onFilled) onFilled(nextCode)
      if (inputRef.current) {
        inputRef.current.blur()
      }
    }
    handleSelect(e)
  }

  function handleSelect(e: any) {
    if (e.target.selectionStart > 6) {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(6, 6)
      }
    }
    const nextSelectionStart = Math.min(e.target.selectionStart, 6)
    const selectionChanged = selectionStart !== nextSelectionStart
    if (isInvalid && selectionChanged) {
      if (onResetValidity) onResetValidity()
    }
    setSelectionStart(nextSelectionStart)
    setSelectionEnd(e.target.selectionEnd)
    setSelectNextEdge(false)
  }

  function handleFocus(e: any) {
    if (inputRef.current) {
      inputRef.current.focus()
    }
    if (onResetValidity) onResetValidity()
    setSelectionStart(e.target.selectionStart)
  }

  function handleBoxClick(index: number) {
    if (inputRef.current) {
      inputRef.current.setSelectionRange(index + 1, index + 1)
    }
  }

  return (
    <View
      className={classnames(styles.container, className)}
      onClick={handleFocus}
      data-valid={isValid}
      data-invalid={isInvalid}
    >
      <input
        className={styles.input}
        ref={handleRef}
        type={'text'}
        onInput={handleInput}
        onSelect={handleSelect}
        maxLength={6}
      />
      <View
        data-filled={!!code[0]}
        data-selected={selectionStart === 0}
        data-highlighted={selectionStart <= 0 && 0 < selectionEnd}
        data-selected-next={selectNextEdge && selectionStart === 0}
        onClick={() => handleBoxClick(0)}
      >
        {code[0]}
      </View>
      <View
        data-filled={!!code[1]}
        data-selected={selectionStart === 1}
        data-highlighted={selectionStart <= 1 && 1 < selectionEnd}
        data-selected-next={selectNextEdge && selectionStart === 1}
        onClick={() => handleBoxClick(1)}
      >
        {code[1]}
      </View>
      <View
        data-filled={!!code[2]}
        data-selected={selectionStart === 2}
        data-highlighted={selectionStart <= 2 && 2 < selectionEnd}
        data-selected-next={selectNextEdge && selectionStart === 2}
        onClick={() => handleBoxClick(2)}
      >
        {code[2]}
      </View>
      <View
        data-filled={!!code[3]}
        data-selected={selectionStart === 3}
        data-highlighted={selectionStart <= 3 && 3 < selectionEnd}
        data-selected-next={selectNextEdge && selectionStart === 3}
        onClick={() => handleBoxClick(3)}
      >
        {code[3]}
      </View>
      <View
        data-filled={!!code[4]}
        data-selected={selectionStart === 4}
        data-highlighted={selectionStart <= 4 && 4 < selectionEnd}
        data-selected-next={selectNextEdge && selectionStart === 4}
        onClick={() => handleBoxClick(4)}
      >
        {code[4]}
      </View>
      <View
        data-filled={!!code[5]}
        data-selected={selectionStart === 5}
        data-highlighted={selectionStart <= 5 && 5 < selectionEnd}
        data-selected-next={
          (selectNextEdge && selectionStart === 5) || selectionStart === 6
        }
        onClick={() => handleBoxClick(5)}
      >
        {code[5]}
      </View>
    </View>
  )
}

export default MfaCodeInput
