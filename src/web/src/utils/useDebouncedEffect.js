// @flow

import { useEffect, useRef } from 'react'

export default function useDebouncedEffect(
  func: () => any,
  deps: Array<any>,
  delay: number,
): void {
  const isInitial = useRef(true)

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false
      return
    }

    const handler = setTimeout(() => {
      func()
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [...deps, delay])
}
