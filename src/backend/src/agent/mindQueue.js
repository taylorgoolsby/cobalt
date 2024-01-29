// @flow

export type EnvokeMind = () => void

const mindQueue: Array<EnvokeMind> = []

// todo: Make this work using SQS

export const enqueue = async (fn: EnvokeMind) => {
  mindQueue.push(fn)
}

export const dequeue = async (): Promise<?EnvokeMind> => {
  const fn = mindQueue.shift()
  return fn
}
