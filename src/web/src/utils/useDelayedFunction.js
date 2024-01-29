// @flow

import React, { useState, useEffect, useCallback, useRef } from 'react'

// This hook accepts a function (func) and a delay in milliseconds (delay)
function useDelayedFunction(
  func: (...args: Array<any>) => any,
  deps: Array<any>,
  delay: number,
): (...args: Array<any>) => any {
  const [timer, setTimer] = useState<any>(null)

  const depsRef = useRef(deps)
  useEffect(() => {
    depsRef.current = deps
  }, deps)

  const startFunctionWithDelay = useCallback(
    (...args: any) => {
      // If there's an existing timer, we clear it to avoid multiple timers running
      if (timer) clearTimeout(timer)

      // Set a new timer with the delay provided
      const newTimer = setTimeout(() => {
        func(...args)
      }, delay)

      // Store the timer ID so it can be cleared later if needed
      setTimer(newTimer)
    },
    [func, delay, timer, ...deps],
  )

  // Clean up the timer when the component using this hook unmounts
  useEffect(() => {
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [timer])

  return startFunctionWithDelay
}

export default useDelayedFunction
