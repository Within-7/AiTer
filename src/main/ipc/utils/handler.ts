import { IpcMainInvokeEvent } from 'electron'

/**
 * Generic IPC handler function type
 * @template TArgs - Input arguments type
 * @template TResult - Success result type
 */
export type IPCHandler<TArgs = unknown, TResult = unknown> = (
  args: TArgs,
  event?: IpcMainInvokeEvent
) => Promise<TResult> | TResult

/**
 * Standard IPC result format
 * @template T - Success data type
 */
export interface IPCResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Handler options for customization
 */
export interface HandlerOptions {
  /**
   * Log errors to console (default: true)
   */
  logErrors?: boolean

  /**
   * Custom error transformer
   * @param error - The caught error
   * @returns Custom error message
   */
  errorTransformer?: (error: unknown) => string

  /**
   * Rate limit in milliseconds
   * Prevents handler from being called more than once within this time
   */
  rateLimit?: number

  /**
   * Custom logger function
   */
  logger?: (message: string, level: 'info' | 'warn' | 'error') => void
}

/**
 * Default error message extractor
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return 'Unknown error'
}

/**
 * Default console logger
 */
function defaultLogger(message: string, level: 'info' | 'warn' | 'error'): void {
  switch (level) {
    case 'info':
      console.log(message)
      break
    case 'warn':
      console.warn(message)
      break
    case 'error':
      console.error(message)
      break
  }
}

/**
 * Rate limiter state tracking
 */
const rateLimitMap = new Map<string, number>()

/**
 * Creates a wrapped IPC handler with automatic error handling and standardized response format
 *
 * @template TArgs - Input arguments type
 * @template TResult - Success result type
 *
 * @param handler - The actual business logic handler
 * @param options - Optional configuration
 * @returns Wrapped handler compatible with ipcMain.handle()
 *
 * @example
 * ```typescript
 * ipcMain.handle('project:add', createHandler(
 *   async ({ path, name }) => {
 *     const project = storeManager.addProject(path, name)
 *     return project
 *   }
 * ))
 * ```
 *
 * @example With options
 * ```typescript
 * ipcMain.handle('terminal:write', createHandler(
 *   async ({ id, data }) => {
 *     return ptyManager.write(id, data)
 *   },
 *   {
 *     rateLimit: 100, // Max once per 100ms
 *     logErrors: true
 *   }
 * ))
 * ```
 */
export function createHandler<TArgs = unknown, TResult = unknown>(
  handler: IPCHandler<TArgs, TResult>,
  options: HandlerOptions = {}
): (event: IpcMainInvokeEvent, args: TArgs) => Promise<IPCResult<TResult>> {
  const {
    logErrors = true,
    errorTransformer = extractErrorMessage,
    rateLimit,
    logger = defaultLogger
  } = options

  return async (event: IpcMainInvokeEvent, args: TArgs): Promise<IPCResult<TResult>> => {
    try {
      // Rate limiting check
      if (rateLimit && rateLimit > 0) {
        const handlerKey = handler.toString() // Use function reference as key
        const lastCallTime = rateLimitMap.get(handlerKey) || 0
        const now = Date.now()

        if (now - lastCallTime < rateLimit) {
          const remainingTime = rateLimit - (now - lastCallTime)
          return {
            success: false,
            error: `Rate limited. Please wait ${remainingTime}ms before retrying.`
          }
        }

        rateLimitMap.set(handlerKey, now)
      }

      // Execute handler
      const result = await handler(args, event)

      // Return success response
      return {
        success: true,
        data: result
      }
    } catch (error) {
      // Extract error message
      const errorMessage = errorTransformer(error)

      // Log error if enabled
      if (logErrors) {
        logger(`[IPC Error] ${errorMessage}`, 'error')
        if (error instanceof Error && error.stack) {
          logger(error.stack, 'error')
        }
      }

      // Return error response
      return {
        success: false,
        error: errorMessage
      }
    }
  }
}

/**
 * Creates a handler that returns only success/failure status (no data)
 *
 * @example
 * ```typescript
 * ipcMain.handle('terminal:resize', createStatusHandler(
 *   async ({ id, cols, rows }) => {
 *     return ptyManager.resize(id, cols, rows)
 *   }
 * ))
 * ```
 */
export function createStatusHandler<TArgs = unknown>(
  handler: IPCHandler<TArgs, boolean>,
  options: HandlerOptions = {}
): (event: IpcMainInvokeEvent, args: TArgs) => Promise<{ success: boolean; error?: string }> {
  return createHandler(handler, options) as (event: IpcMainInvokeEvent, args: TArgs) => Promise<{ success: boolean; error?: string }>
}

/**
 * Creates a handler with no arguments
 *
 * @example
 * ```typescript
 * ipcMain.handle('projects:list', createNoArgsHandler(
 *   async () => {
 *     return storeManager.getProjects()
 *   }
 * ))
 * ```
 */
export function createNoArgsHandler<TResult = unknown>(
  handler: () => Promise<TResult> | TResult,
  options: HandlerOptions = {}
): (event: IpcMainInvokeEvent, args?: unknown) => Promise<IPCResult<TResult>> {
  return createHandler(async () => await handler(), options) as (event: IpcMainInvokeEvent, args?: unknown) => Promise<IPCResult<TResult>>
}

/**
 * Batch handler creator for multiple related handlers
 * Useful for creating multiple handlers with shared options
 *
 * @example
 * ```typescript
 * const createProjectHandler = createHandlerFactory({ logErrors: true })
 *
 * ipcMain.handle('project:add', createProjectHandler(async ({ path, name }) => {
 *   return storeManager.addProject(path, name)
 * }))
 *
 * ipcMain.handle('project:remove', createProjectHandler(async ({ id }) => {
 *   return storeManager.removeProject(id)
 * }))
 * ```
 */
export function createHandlerFactory(defaultOptions: HandlerOptions = {}) {
  return <TArgs = unknown, TResult = unknown>(
    handler: IPCHandler<TArgs, TResult>,
    overrideOptions?: HandlerOptions
  ) => {
    const mergedOptions = { ...defaultOptions, ...overrideOptions }
    return createHandler(handler, mergedOptions)
  }
}

/**
 * Clear rate limit cache for a specific handler or all handlers
 * Useful for testing or resetting rate limits
 */
export function clearRateLimits(handler?: IPCHandler): void {
  if (handler) {
    rateLimitMap.delete(handler.toString())
  } else {
    rateLimitMap.clear()
  }
}
