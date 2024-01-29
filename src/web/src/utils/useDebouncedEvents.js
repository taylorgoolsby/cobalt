// @flow

import { useEffect, useState } from 'react'

type Event = {
  type: string,
  callback: () => any,
}

type QueueEvent = (type: string, callback: (events: Array<Event>) => any) => any

export default function useDebouncedEvents(
  debounceTime: number = 16,
): QueueEvent {
  const [events, setEvents] = useState<Array<any>>([])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (events.length) {
        for (const event of events) {
          event.callback(events)
        }
        setEvents([])
      }
    }, debounceTime)

    return () => {
      clearTimeout(timeout)
    }
  }, [events])

  const queueEvent: QueueEvent = (type, callback) => {
    setEvents([
      ...events,
      {
        type,
        callback,
      },
    ])
  }

  return queueEvent
}
