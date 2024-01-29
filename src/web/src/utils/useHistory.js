// @flow

import { getHistory } from './history.js'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { History } from './history.js'

export default function useHistory(): [?History, string] {
  const history = getHistory()

  const [pathname, setPathname] = useState(
    usePathname() ?? history?.location?.pathname,
  )
  useEffect(() => {
    if (history?.location?.pathname) {
      setPathname(history?.location?.pathname)
    }
  }, [history?.location?.pathname])

  return [history, pathname]
}
