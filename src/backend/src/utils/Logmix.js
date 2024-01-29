// @flow

// $FlowFixMe
import { EventEmitter } from 'node:events'
import stringify from 'json-stringify-safe'
import redact from './redact.js'

const ENABLE = false

type Level = 'log' | 'debug' | 'info' | 'warn' | 'error'
type Message = {
  timestamp: number,
  level: string,
  args: Array<any>,
  value: string,
  stack: any,
}

export class LogEmitter extends EventEmitter {
  on(...args: Array<any>): Message {
    super.on(...args)
    return args[1]
  }
}
const logEvents = new LogEmitter()

if (ENABLE) {
  // log
  // info
  // debug
  // warn
  // error

  const oldLog = console.log // eslint-disable-line no-console
  function newLog(...args: Array<any>) {
    args = args.map((el) => redact(el))
    logEvents.emit('log', formatMessage('log', ...args))
    return oldLog(...args)
  }
  // $FlowFixMe
  console.log = newLog.bind(console) // eslint-disable-line no-console

  const oldInfo = console.info
  function newInfo(...args: Array<any>) {
    logEvents.emit('info', formatMessage('info', ...args))
    return oldInfo(...args)
  }
  // $FlowFixMe
  console.info = newInfo.bind(console)

  const oldDebug = console.debug
  function newDebug(...args: Array<any>) {
    logEvents.emit('debug', formatMessage('debug', ...args))
    return oldDebug(...args)
  }
  // $FlowFixMe
  console.debug = newDebug.bind(console)

  const oldWarn = console.warn
  function newWarn(...args: Array<any>) {
    logEvents.emit('warn', formatMessage('warn', ...args))
    return oldWarn(...args)
  }
  // $FlowFixMe
  console.warn = newWarn.bind(console)

  const oldError = console.error
  function newError(...args: Array<any>) {
    logEvents.emit('error', formatMessage('error', ...args))
    return oldError(...args)
  }
  // $FlowFixMe
  console.error = newError.bind(console)
}

function formatMessage(level: Level, ...args: Array<any>): Message {
  let stack
  if (args[0] instanceof Error) {
    stack = args[0].stack
  }

  const timestamp = Date.now()
  return {
    timestamp,
    level,
    args,
    value: `${args
      .map((a) => {
        if (typeof a === 'object' && !Array.isArray(a)) {
          return stringify(a)
        }
        return (a ?? '').toString()
      })
      .join(' ')}`,
    stack,
  }
}

const logs = []
const N_LOGS = 1

function feedLog(message: Message) {
  logs.push(message)
  if (logs.length > N_LOGS) {
    logs.shift()
  }
}

logEvents.on('log', (message) => {
  feedLog(message)
})

logEvents.on('debug', (message) => {
  feedLog(message)
})

logEvents.on('info', (message) => {
  feedLog(message)
})

logEvents.on('warn', (message) => {
  feedLog(message)
})

logEvents.on('error', (message) => {
  feedLog(message)
})

export default class Logmix {
  static logs: Array<Message> = logs
  static logEvents: LogEmitter = logEvents
}
