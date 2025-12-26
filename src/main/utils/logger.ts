/**
 * Structured Logger for AiTer Main Process
 *
 * Features:
 * - Log levels: debug, info, warn, error
 * - Structured output with timestamps, levels, and context
 * - Environment variable control via LOG_LEVEL
 * - Production default: info, Development default: debug
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

class Logger {
  private logLevel: LogLevel
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  }

  constructor() {
    // Determine log level from environment or defaults
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel
    const isDev = process.env.NODE_ENV !== 'production'

    this.logLevel = envLogLevel || (isDev ? 'debug' : 'info')

    // Validate log level
    if (!Object.prototype.hasOwnProperty.call(this.levels, this.logLevel)) {
      console.warn(`Invalid LOG_LEVEL: ${envLogLevel}, falling back to ${isDev ? 'debug' : 'info'}`)
      this.logLevel = isDev ? 'debug' : 'info'
    }
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.logLevel]
  }

  /**
   * Format timestamp for log output
   */
  private formatTimestamp(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const ms = String(now.getMilliseconds()).padStart(3, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`
  }

  /**
   * Format log message with structure
   */
  private formatMessage(
    level: LogLevel,
    module: string,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = this.formatTimestamp()
    const levelUpper = level.toUpperCase().padEnd(5, ' ')
    const moduleFormatted = `[${module}]`

    let output = `[${timestamp}] [${levelUpper}] ${moduleFormatted} ${message}`

    if (context && Object.keys(context).length > 0) {
      // Format context as key=value pairs
      const contextStr = Object.entries(context)
        .map(([key, value]) => {
          // Handle different value types
          if (value === null) return `${key}=null`
          if (value === undefined) return `${key}=undefined`
          if (typeof value === 'object') {
            try {
              return `${key}=${JSON.stringify(value)}`
            } catch {
              return `${key}=[circular]`
            }
          }
          return `${key}=${value}`
        })
        .join(', ')

      output += ` | ${contextStr}`
    }

    return output
  }

  /**
   * Log at DEBUG level
   */
  debug(module: string, message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', module, message, context)
      console.debug(formatted)
    }
  }

  /**
   * Log at INFO level
   */
  info(module: string, message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', module, message, context)
      console.log(formatted)
    }
  }

  /**
   * Log at WARN level
   */
  warn(module: string, message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', module, message, context)
      console.warn(formatted)
    }
  }

  /**
   * Log at ERROR level
   */
  error(module: string, message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const formatted = this.formatMessage('error', module, message, context)
      console.error(formatted)
    }
  }

  /**
   * Get current log level
   */
  getLogLevel(): LogLevel {
    return this.logLevel
  }

  /**
   * Set log level dynamically
   */
  setLogLevel(level: LogLevel): void {
    if (Object.prototype.hasOwnProperty.call(this.levels, level)) {
      this.logLevel = level
      this.info('Logger', 'Log level changed', { newLevel: level })
    } else {
      this.warn('Logger', 'Invalid log level, ignoring', { requestedLevel: level })
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export type for module names (helps with consistency)
export type LogModule =
  | 'App'
  | 'PTYManager'
  | 'ProjectServerManager'
  | 'LocalFileServer'
  | 'PortManager'
  | 'FileSystem'
  | 'IPC'
  | 'StoreManager'
  | 'PluginManager'
  | 'NpmPluginInstaller'
  | 'Window'
  | string // Allow custom module names
