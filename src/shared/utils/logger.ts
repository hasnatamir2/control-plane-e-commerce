import type { IncomingMessage, ServerResponse } from 'http'
import morgan, { FormatFn, TokenIndexer } from 'morgan'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

type MorganLogRequest = Partial<IncomingMessage> & {
  logLevel: LogLevel
  logMessage: string
  logMeta?: unknown
}

type MorganLogResponse = Partial<ServerResponse>

morgan.token('level', (req: IncomingMessage) => {
  const logReq = req as MorganLogRequest
  return logReq.logLevel.toUpperCase()
})

morgan.token('message', (req: IncomingMessage) => {
  return (req as MorganLogRequest).logMessage
})

morgan.token('meta', (req: IncomingMessage) => {
  const meta = (req as MorganLogRequest).logMeta
  if (!meta) {
    return ''
  }

  try {
    return ` ${JSON.stringify(meta)}`
  } catch {
    return ' [meta:unserializable]'
  }
})

const formatLine: FormatFn = morgan.compile(':date[iso] [:level] :message:meta')
const tokens = morgan as unknown as TokenIndexer

class Logger {
  private static write(level: LogLevel, message: string, meta?: unknown): void {
    const req = {
      logLevel: level,
      logMessage: message,
      logMeta: meta,
    } as MorganLogRequest
    const res = {} as MorganLogResponse
    const line = formatLine(tokens, req as IncomingMessage, res as ServerResponse)
    if (!line) {
      return
    }

    const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout
    stream.write(`${line}\n`)
  }

  static info(message: string, meta?: unknown): void {
    this.write('info', message, meta)
  }

  static warn(message: string, meta?: unknown): void {
    this.write('warn', message, meta)
  }

  static error(message: string, meta?: unknown): void {
    this.write('error', message, meta)
  }

  static debug(message: string, meta?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      this.write('debug', message, meta)
    }
  }
}

export { Logger }
