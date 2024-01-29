// @flow

import type { AbstractComponent } from 'react'
import React, { useRef, useState } from 'react'
import Input from './Input.js'
import View from './View.js'
import { css } from 'goober'
import DropdownMenu from './DropdownMenu.js'
import FlagIcon from './FlagIcon.js'
import { PiCaretDownBold } from 'react-icons/pi'
import Button from './Button.js'
import Text from './Text.js'
import Phone from '../utils/Phone.js'
import classnames from 'classnames'

const styles = {
  phoneInput: css`
    flex-direction: row;

    &[disabled=''],
    &[disabled='true'] {
      opacity: 0.5;

      input {
        opacity: 1;
      }
    }

    &[data-menu-open='true'] {
      border-bottom-right-radius: 0;
      border-bottom-left-radius: 0;
    }
  `,
  input: css`
    flex: 1;
    align-self: stretch;
    padding: 0 10px;
    border-radius: 4px;
  `,
  flagIcon: css`
    height: 24px;
    width: 24px;
  `,
  item: css`
    min-height: inherit;
    flex-direction: row;
    align-items: center;
    margin-left: 12px;

    .calling-code {
      min-width: 52px;
    }

    .name {
      flex: 1;
      margin-left: 18px;
      line-height: 16px;
    }

    > div {
      min-height: inherit;
      align-self: flex-start;
      flex-direction: row;
      align-items: center;

      > span {
        margin-left: 20px;
      }
    }
  `,
  expandButton: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    align-self: stretch;
    min-width: 46px;

    *:first-child {
      margin-left: 10px;
    }

    * {
      margin: 0 5px;
    }

    *:last-child {
      margin-right: 10px;
    }

    /*&[disabled=''], &[disabled='true'] {
      opacity: 0.5;
    }*/
  `,
}

const renderFlagMenuItem = (callingCode: string) => {
  const countryCodes = Phone.getCountryCodes(callingCode)
  const countryCode = countryCodes[0]

  return (
    <View className={styles.item}>
      <View>
        <FlagIcon className={styles.flagIcon} countryCode={countryCode} />
        <Text className="calling-code">
          {Phone.formatCallingCode(callingCode)}
        </Text>
      </View>
      <Text className="name">{Phone.getCallingCodeName(callingCode)}</Text>
    </View>
  )
}

export type PhoneInputProps = {|
  className?: ?string,
  callingCode: string,
  onCallingCodeChange: (nextCallingCode: string) => void,
  phoneNumber: string,
  onPhoneNumberChange: (nextPhoneNumber: string) => void,
  disabled?: boolean,
|}

const PhoneInput: AbstractComponent<PhoneInputProps, any> = (
  props: PhoneInputProps,
) => {
  const {
    className,
    callingCode,
    onCallingCodeChange,
    phoneNumber,
    onPhoneNumberChange,
    disabled,
  } = props

  const inputRef = useRef(null)
  const [showMenu, setShowMenu] = useState(false)

  const selectedCallingCode = callingCode //|| Phone.geographicCallingCodes[0]
  const selectedPhoneNumber = phoneNumber

  function toggleMenu() {
    setShowMenu(!showMenu)
    if (!showMenu === false) {
      focusInput()
    }
  }

  function handleSelect(callingCode: any) {
    onCallingCodeChange(callingCode)
    onPhoneNumberChange(callingCode + ' ')
    setTimeout(() => {
      // A timeout is needed because the input cannot be focused right now because it is still disabled.
      focusInput()
    })
  }

  function closeMenu() {
    setShowMenu(false)
  }

  function focusInput() {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  function handleInput(e: any) {
    const value = e.target.value
    if (value.length >= selectedCallingCode.length) {
      onPhoneNumberChange(e.target.value)
    }
  }

  const countryCodesForThisCallingCode = selectedCallingCode
    ? Phone.getCountryCodes(selectedCallingCode)
    : ['-']
  const selectedCountryCode = countryCodesForThisCallingCode[0]
  const mask = selectedCallingCode ? Phone.getMask(selectedCallingCode) : null

  return (
    <View
      className={classnames(styles.phoneInput, className)}
      disabled={disabled}
      data-menu-open={showMenu}
    >
      <Button
        className={styles.expandButton}
        onClick={toggleMenu}
        disabled={disabled}
      >
        <PiCaretDownBold />
        <FlagIcon
          className={styles.flagIcon}
          countryCode={selectedCountryCode}
        />
      </Button>
      <Input
        ref={inputRef}
        className={styles.input}
        mask={mask}
        value={selectedPhoneNumber}
        onInput={handleInput}
        disabled={!selectedCallingCode || disabled}
        placeholder={!selectedCallingCode ? 'Select a calling code' : ''}
      />
      <DropdownMenu
        show={showMenu}
        items={Phone.geographicCallingCodes}
        renderItem={renderFlagMenuItem}
        selectedItem={selectedCallingCode}
        onSelect={handleSelect}
        onClose={closeMenu}
      />
    </View>
  )
}

export default PhoneInput
