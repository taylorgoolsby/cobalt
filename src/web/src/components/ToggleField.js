// @flow

import type { AbstractComponent } from 'react'
import React from 'react'
import { css } from 'goober'
import ToggleInput from './ToggleInput.js'
import type { ToggleInputProps } from './ToggleInput.js'
import Colors from '../Colors.js'

const styles = {
  field: css`
    display: flex;
    flex-direction: row;
    color: ${Colors.black};
    align-items: center;
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
    /*align-self: stretch;*/
    /*border: 1px solid ${Colors.black};*/
    /*height: 40px;*/
    /*padding: 0 10px;*/
    /*margin-top: 5px;*/
    /*border-radius: 4px;*/
    margin-right: 22px;
  `,
}

type ToggleFieldProps = {|
  ...ToggleInputProps,
  label: string,
|}

const ToggleField: AbstractComponent<ToggleFieldProps, any> = (
  props: ToggleFieldProps,
) => {
  const { label, ...rest } = props

  return (
    <div className={styles.field}>
      <ToggleInput className={styles.input} {...rest} />
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
    </div>
  )
}

export default ToggleField
