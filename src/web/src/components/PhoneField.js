// @flow

import type { AbstractComponent } from 'react'
import type { PhoneInputProps } from './PhoneInput.js'
import React, { useEffect, useState } from 'react'
import PhoneInput from './PhoneInput.js'
import { css } from 'goober'
import Colors from '../Colors.js'
import Phone from '../utils/Phone.js'
import { PiXBold, PiCheckBold } from 'react-icons/pi'
import View from './View.js'
import classnames from 'classnames'
import { textFieldClassName } from './TextField.js'

const styles = {
  phoneField: css``,
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
  input: css`
    align-self: stretch;
    border: 1px solid ${Colors.black};
    height: 40px;
    /*padding: 0 10px;*/
    margin-top: 5px;
    border-radius: 4px;
  `,
}

type PhoneFieldProps = {|
  ...PhoneInputProps,
  label: string,
  onValidityChange?: (isValid: boolean) => void,
|}

const PhoneField: AbstractComponent<PhoneFieldProps, any> = (
  props: PhoneFieldProps,
) => {
  const {
    label,
    onCallingCodeChange,
    onPhoneNumberChange,
    onValidityChange,
    phoneNumber,
    callingCode,
    disabled,
    ...rest
  } = props

  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    if (onValidityChange) onValidityChange(isValid)
  }, [isValid])

  function updateValidity(phoneCallingCode: string, phoneNumber: string) {
    const value = Phone.isValid(phoneCallingCode, phoneNumber)
    setIsValid(value)
  }

  function handleCallingCodeChange(value: string) {
    if (onCallingCodeChange) onCallingCodeChange(value)
    updateValidity(value, phoneNumber)
  }

  function handlePhoneNumberChange(value: string) {
    if (onPhoneNumberChange) onPhoneNumberChange(value)
    updateValidity(callingCode, value)
  }

  const showValidation = !!callingCode && !disabled

  return (
    <View className={classnames(styles.phoneField, textFieldClassName)}>
      <View className={styles.labelRow}>
        {label}
        {showValidation ? (
          <div
            className={'validation'}
            data-invalid={!isValid}
            data-valid={isValid}
          >
            {isValid ? '' : 'Invalid Number'}
            {isValid ? <PiCheckBold /> : <PiXBold />}
          </div>
        ) : null}
      </View>
      <PhoneInput
        className={styles.input}
        callingCode={callingCode}
        onCallingCodeChange={handleCallingCodeChange}
        phoneNumber={phoneNumber}
        onPhoneNumberChange={handlePhoneNumberChange}
        disabled={disabled}
        {...rest}
      />
    </View>
  )
}

export default PhoneField
