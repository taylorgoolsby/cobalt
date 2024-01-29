// @flow

import type { AbstractComponent } from 'react'
import React from 'react'
import { css } from 'goober'
import classnames from 'classnames'
import View from './View.js'
import Colors from '../Colors.js'

const styles = {
  container: css`
    flex-direction: row;
    align-self: stretch;
    height: 30px;
    background-color: ${Colors.controlBg};
    padding: 0 8px;

    /********** Range Input Styles **********/
    /*Range Reset*/
    input[type='range'] {
      -webkit-appearance: none;
      appearance: none;
      background: transparent;
      cursor: pointer;
      /*width: 15rem;*/
    }

    /* Removes default focus */
    input[type='range']:focus {
      outline: none;
    }

    /***** Chrome, Safari, Opera and Edge Chromium styles *****/
    /* slider track */
    input[type='range']::-webkit-slider-runnable-track,
    input[type='range']::-moz-range-track {
      background-color: ${Colors.white85};
      border-radius: 2px;
      height: 4px;
    }

    /* slider thumb */
    input[type='range']::-webkit-slider-thumb,
    input[type='range']::-moz-range-thumb {
      -webkit-appearance: none; /* Override default look */
      appearance: none;
      /*margin-top: -12px; !* Centers thumb on the track *!*/

      /*custom styles*/
      background-color: ${Colors.white};
      width: 16px;
      height: 16px;
      border-radius: 8px;
      border: none;
    }

    input[type='range']:focus::-webkit-slider-thumb,
    input[type='range']:focus::-moz-range-thumb {
      outline: none;
    }
  `,
  input: css`
    flex: 1;
    align-self: center;
  `,
}

type RangeInputProps = {|
  className?: ?string,
  value?: ?number,
  onInput?: (e: any) => void,
  min?: ?number,
  max?: ?number,
|}

const RangeInput: AbstractComponent<RangeInputProps> = (
  props: RangeInputProps,
) => {
  const { className, value, onInput, min, max } = props

  function stopPropagation(e: any) {
    e.stopPropagation()
  }

  return (
    <View className={classnames(styles.container, className)}>
      <input
        className={styles.input}
        type="range"
        value={value}
        onInput={onInput}
        min={min}
        max={max}
        onPointerDown={stopPropagation}
        onPointerUp={stopPropagation}
        onPointerMove={stopPropagation}
      />
    </View>
  )
}

export default RangeInput
