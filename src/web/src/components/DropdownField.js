// @flow

import type { AbstractComponent } from 'react'
import type { DropdownInputProps } from './DropdownInput.js'
import React from 'react'
import { css } from 'goober'
import classnames from 'classnames'
import DropdownInput from './DropdownInput.js'
import Colors from '../Colors.js'

const styles = {
  container: css`
    display: flex;
    flex-direction: column;
    color: ${Colors.black};
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
  input: css`
    align-self: flex-start;
    border: 1px solid ${Colors.black};
    height: 40px;
    border-radius: 4px;
    /*padding: 0 10px;*/
    margin-top: 5px;
  `,
}

type DropdownFieldProps = {|
  ...DropdownInputProps,
  className?: ?string,
  label: string,
|}

const DropdownField: AbstractComponent<DropdownFieldProps> = (
  props: DropdownFieldProps,
) => {
  const { className, label, ...rest } = props

  return (
    <div className={classnames(styles.container, className)}>
      <div className={styles.labelRow}>
        {label}
        {/*{showValidation ? (*/}
        {/*  <div*/}
        {/*    className={'validation'}*/}
        {/*    data-invalid={!isValid}*/}
        {/*    data-valid={isValid}*/}
        {/*  >*/}
        {/*    {isValid ? '' : 'Invalid Number'}*/}
        {/*    {isValid ? <PiCheckBold /> : <PiXBold />}*/}
        {/*  </div>*/}
        {/*) : null}*/}
      </div>
      <DropdownInput className={styles.input} {...rest} />
    </div>
  )
}

export default DropdownField
