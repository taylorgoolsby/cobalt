// @flow

import { useEffect, useRef, useState } from 'react'
import isEqual from 'fast-deep-equal/es6'

function useDeepEffect(callback: any, dependencies: any) {
  const currentDependenciesRef = useRef()

  if (
    !currentDependenciesRef.current ||
    !isEqual(currentDependenciesRef.current, dependencies)
  ) {
    currentDependenciesRef.current = dependencies
  }

  useEffect(() => {
    callback()
  }, [currentDependenciesRef.current])
}

// The initial value should be from the server.
// If local changes update the value, then the locally updated value is returned.
// If server changes update the value, then the new server value is returned.
// If the server changed the value, then no useEffects that depend on it should trigger.
// Only local changes cause changes in any useEffects.
// This is achieved by setting up effects on localValue, not newestValue.
// Use newestValue for rendering, and localValue for listening to updates.
// Note that this hook does not handle the case where a rerender occurs because the server responds with updated values,
// but those updated values have not actually changed.
export default function useServerState<T>(
  serverValue: any,
): [T, T, (T) => any, (T) => any] {
  const [localValue, setValue] = useState(serverValue)
  const [newestValue, setNewestValue] = useState(serverValue)

  const isInitial = useRef(true)
  useDeepEffect(() => {
    if (isInitial.current) {
      isInitial.current = false
    } else {
      setNewestValue(serverValue)
    }
  }, [serverValue])

  function setLocalValue(v: any) {
    setValue(v)
    setNewestValue(v)
  }

  // Example: const [agents, localAgents, setLocalAgents, setServerAgents] = useServerState(serverAgents)
  return [newestValue, localValue, setLocalValue, setNewestValue]
}
