import { IpcMainInvokeEvent } from 'electron'
import { logger } from '../../utils/logger'

/**
 * Standard IPC result format with error codes
 * @template T - Success data type
 */
export interface IPCResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

/**
 * Generic IPC handler function type
 * @template TArgs - Input arguments type
 * @template TResult - Success result type
 */
export type IPCHandler<TArgs = unknown, TResult = unknown> = (
  event: IpcMainInvokeEvent,
  args: TArgs
) => Promise<TResult> | TResult

/**
 * Extract error message from unknown error types
 * Handles Error objects, strings, and objects with message property
 */
export function extractErrorMessage(error: unknown): string {
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
 * Extract error code from error types
 * Returns the error name for Error instances, or a custom code property if available
 */
export function extractErrorCode(error: unknown): string {
  if (error instanceof Error) {
    return error.name
  }
  if (error && typeof error === 'object' && 'code' in error) {
    return String(error.code)
  }
  return 'UNKNOWN_ERROR'
}

/**
 * Creates a wrapped IPC handler with automatic error handling, logging, and standardized response
 *
 * This middleware:
 * - Catches all errors automatically
 * - Logs errors using the structured logger
 * - Returns standardized IPCResult format
 * - Includes error codes for better error categorization
 *
 * @template TArgs - Input arguments type
 * @template TResult - Success result type
 *
 * @param handlerName - Name of the handler for logging (e.g., 'terminal:create')
 * @param handler - The actual business logic handler
 * @returns Wrapped handler compatible with ipcMain.handle()
 *
 * @example
 * ```typescript
 * ipcMain.handle('terminal:create', createIPCHandler(
 *   'terminal:create',
 *   async (event, args) => {
 *     const id = uuidv4()
 *     const terminal = ptyManager.create(id, args.cwd, ...)
 *     return terminal
 *   }
 * ))
 * ```
 */
export function createIPCHandler<TArgs = unknown, TResult = unknown>(
  handlerName: string,
  handler: IPCHandler<TArgs, TResult>
): (event: IpcMainInvokeEvent, args: TArgs) => Promise<IPCResult<TResult>> {
  return async (event: IpcMainInvokeEvent, args: TArgs): Promise<IPCResult<TResult>> => {
    try {
      const result = await handler(event, args)
      return { success: true, data: result }
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      const errorCode = extractErrorCode(error)

      // Log error using structured logger
      logger.error('IPC', `Handler error [${handlerName}]`, {
        handler: handlerName,
        error: errorMessage,
        code: errorCode
      })

      // Log stack trace in debug mode for better debugging
      if (error instanceof Error && error.stack) {
        logger.debug('IPC', `Stack trace [${handlerName}]`, {
          stack: error.stack
        })
      }

      return {
        success: false,
        error: errorMessage,
        code: errorCode
      }
    }
  }
}

/**
 * Creates a status-only handler (returns only success/failure, no data)
 *
 * @template TArgs - Input arguments type
 *
 * @param handlerName - Name of the handler for logging
 * @param handler - The business logic handler that returns boolean
 * @returns Wrapped handler
 *
 * @example
 * ```typescript
 * ipcMain.handle('terminal:resize', createStatusHandler(
 *   'terminal:resize',
 *   async (event, { id, cols, rows }) => {
 *     return ptyManager.resize(id, cols, rows)
 *   }
 * ))
 * ```
 */
export function createStatusHandler<TArgs = unknown>(
  handlerName: string,
  handler: IPCHandler<TArgs, boolean>
): (event: IpcMainInvokeEvent, args: TArgs) => Promise<{ success: boolean; error?: string; code?: string }> {
  return async (event: IpcMainInvokeEvent, args: TArgs) => {
    try {
      const success = await handler(event, args)
      return { success }
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      const errorCode = extractErrorCode(error)

      logger.error('IPC', `Handler error [${handlerName}]`, {
        handler: handlerName,
        error: errorMessage,
        code: errorCode
      })

      return {
        success: false,
        error: errorMessage,
        code: errorCode
      }
    }
  }
}

/**
 * Creates a handler with no arguments
 *
 * @template TResult - Success result type
 *
 * @param handlerName - Name of the handler for logging
 * @param handler - The business logic handler with no arguments
 * @returns Wrapped handler
 *
 * @example
 * ```typescript
 * ipcMain.handle('projects:list', createNoArgsHandler(
 *   'projects:list',
 *   async () => {
 *     return storeManager.getProjects()
 *   }
 * ))
 * ```
 */
export function createNoArgsHandler<TResult = unknown>(
  handlerName: string,
  handler: (event: IpcMainInvokeEvent) => Promise<TResult> | TResult
): (event: IpcMainInvokeEvent, args?: unknown) => Promise<IPCResult<TResult>> {
  return createIPCHandler(handlerName, async (event: IpcMainInvokeEvent) => {
    return await handler(event)
  })
}

/**
 * Creates a handler factory with shared configuration
 * Useful for creating multiple handlers with consistent error handling
 *
 * @param namespace - Handler namespace (e.g., 'terminal', 'project')
 * @returns Factory function for creating handlers in this namespace
 *
 * @example
 * ```typescript
 * const createTerminalHandler = createHandlerFactory('terminal')
 *
 * ipcMain.handle('terminal:create', createTerminalHandler(
 *   'create',
 *   async (event, args) => { ... }
 * ))
 *
 * ipcMain.handle('terminal:write', createTerminalHandler(
 *   'write',
 *   async (event, args) => { ... }
 * ))
 * ```
 */
export function createHandlerFactory(namespace: string) {
  return <TArgs = unknown, TResult = unknown>(
    method: string,
    handler: IPCHandler<TArgs, TResult>
  ) => {
    const handlerName = `${namespace}:${method}`
    return createIPCHandler(handlerName, handler)
  }
}
