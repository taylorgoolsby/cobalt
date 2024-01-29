// @flow

import bezier from 'cubic-bezier'

const timingFunction = bezier(0.6, 0, 0.8, 0.06, 200)

export default function fadingGradient(
  r: number,
  g: number,
  b: number,
): string {
  const alphaStops = []

  const n = 16
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const y = timingFunction(t)
    alphaStops.push(1 - y)
  }

  const stops = alphaStops.map((a, i) => {
    const p = (i / (alphaStops.length - 1)) * 100
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)}) ${p.toFixed(3)}%`
  })

  const result = `linear-gradient(
    to bottom, 
    ${stops.join(',\n')}
  )`

  return result
}
