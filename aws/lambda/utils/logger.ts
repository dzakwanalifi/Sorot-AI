import { AsyncLocalStorage } from 'async_hooks'

// Context for request-scoped logging
interface LogContext {
  requestId: string
  loggedMessages: Set<string>
  startTime: number
}

// Global AsyncLocalStorage instance
const asyncLocalStorage = new AsyncLocalStorage<LogContext>()

// Logger utility with deduplication
export class Logger {
  private static instance: Logger

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  /**
   * Start a new logging context for a request
   */
  startRequestContext(requestId?: string): void {
    const context: LogContext = {
      requestId: requestId || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      loggedMessages: new Set(),
      startTime: Date.now()
    }

    asyncLocalStorage.enterWith(context)
  }

  /**
   * Log a message with deduplication (only logs once per request context)
   */
  info(message: string, ...args: any[]): void {
    const context = asyncLocalStorage.getStore()
    if (!context) {
      // No context, log normally
      console.log(`[${new Date().toISOString()}] ${message}`, ...args)
      return
    }

    if (context.loggedMessages.has(message)) {
      return // Skip duplicate
    }

    context.loggedMessages.add(message)
    console.log(`[${new Date().toISOString()}] [${context.requestId}] ${message}`, ...args)
  }

  /**
   * Log an error (always logged, not deduplicated)
   */
  error(message: string, error?: Error, ...args: any[]): void {
    const context = asyncLocalStorage.getStore()
    const requestId = context?.requestId || 'unknown'

    console.error(`[${new Date().toISOString()}] [${requestId}] ERROR: ${message}`, error?.message || '', ...args)
  }

  /**
   * Log a warning (always logged, not deduplicated)
   */
  warn(message: string, ...args: any[]): void {
    const context = asyncLocalStorage.getStore()
    const requestId = context?.requestId || 'unknown'

    console.warn(`[${new Date().toISOString()}] [${requestId}] WARN: ${message}`, ...args)
  }

  /**
   * Get current request context
   */
  getCurrentContext(): LogContext | undefined {
    return asyncLocalStorage.getStore()
  }

  /**
   * Log performance timing
   */
  timing(operation: string, startTime?: number): void {
    const context = asyncLocalStorage.getStore()
    const endTime = Date.now()
    const duration = startTime ? endTime - startTime : (context ? endTime - context.startTime : 0)

    this.info(`${operation} completed in ${duration}ms`)
  }
}

// Export singleton instance
export const logger = Logger.getInstance()

// Helper functions for easy access
export const logInfo = (message: string, ...args: any[]) => logger.info(message, ...args)
export const logError = (message: string, error?: Error, ...args: any[]) => logger.error(message, error, ...args)
export const logWarn = (message: string, ...args: any[]) => logger.warn(message, ...args)
export const startLoggingContext = (requestId?: string) => logger.startRequestContext(requestId)
