// @flow

import type { AbstractComponent } from 'react'
import React, { forwardRef } from 'react'
import { css } from 'goober'
import Input from './Input.js'
import Colors from '../Colors.js'
import View from './View.js'
import { PiCheckBold, PiXBold } from 'react-icons/pi'
import Config from '../Config.js'
import classnames from 'classnames'

export const textFieldClassName: string = css`
  display: flex;
  flex-direction: column;
  color: ${Colors.black};
  width: ${Config.fieldWidth}px;
  align-items: stretch;

  @media (max-width: 410px) {
    width: 264px;
  }
`

const styles = {
  textField: textFieldClassName,
  inputMods: css`
    input,
    textarea {
      align-self: stretch;
      border: 1px solid ${Colors.black};
      height: 40px;
      padding: 0 10px;
      margin-top: 5px;
      border-radius: 4px;
    }

    &[data-has-label='false'] {
      input,
      textarea {
        margin-top: 0;
      }
    }
  `,
  labelRow: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    > .validation {
      display: flex;
      flex-direction: row;
      align-items: center;

      &[data-valid='true'] {
        color: ${Colors.green};
      }

      &[data-invalid='true'] {
        color: ${Colors.red};
      }

      > svg {
        margin-top: 2px;
        margin-left: 2px;
        margin-right: 2px;
      }
    }
  `,
}

type TextFieldProps = {
  className?: string,
  style?: any,
  label?: string,
  placeholder?: ?string,
  value?: ?string,
  initialValue?: ?string,
  type?: ?string,
  showValidIcon?: boolean,
  isValid?: boolean,
  validationMessage?: string,
  onInput?: ?(e: any) => any,
  onKeyDown?: ?(e: any) => any,
  onEnterPress?: (e: any) => any,
  disabled?: ?boolean,
  maxLength?: ?number,
  multiline?: ?boolean,
  onFocus?: ?(e: any) => void,
  onBlur?: ?(e: any) => void,
  autoFocus?: boolean,
}

const TextField: AbstractComponent<TextFieldProps, any> = forwardRef(
  (props: TextFieldProps, ref: any): any => {
    const {
      className,
      label,
      placeholder,
      value,
      initialValue,
      type,
      showValidIcon,
      isValid,
      validationMessage,
      onInput,
      onKeyDown,
      onEnterPress,
      disabled,
      maxLength,
      multiline,
      onFocus,
      onBlur,
      autoFocus,
    } = props

    const showLabelRow = label !== undefined
    const showValidationRow = showValidIcon || validationMessage

    return (
      <View
        className={classnames(styles.textField, styles.inputMods, className)}
        data-has-label={!!label}
      >
        {showLabelRow ? (
          <View className={styles.labelRow}>
            {label}
            {showValidationRow ? (
              <div
                className={'validation'}
                data-invalid={!isValid}
                data-valid={isValid}
              >
                {validationMessage}
                {showValidIcon ? isValid ? <PiCheckBold /> : <PiXBold /> : null}
              </div>
            ) : null}
          </View>
        ) : null}
        <Input
          ref={ref}
          placeholder={placeholder}
          value={value}
          initialValue={initialValue}
          type={type}
          onInput={onInput}
          onKeyDown={onKeyDown}
          onEnterPress={onEnterPress}
          disabled={disabled}
          maxLength={maxLength}
          multiline={multiline}
          onFocus={onFocus}
          onBlur={onBlur}
          autoFocus={autoFocus}
        />
      </View>
    )
  },
)

export default TextField
