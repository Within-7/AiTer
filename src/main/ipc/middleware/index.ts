/**
 * IPC Error Handling Middleware
 *
 * Provides unified error handling for all IPC handlers with:
 * - Automatic error catching and standardized response format
 * - Integration with structured logger (src/main/utils/logger.ts)
 * - Error code extraction for better error categorization
 * - Stack trace logging in debug mode
 *
 * @example Basic usage
 * ```typescript
 * import { createIPCHandler } from './middleware'
 *
 * ipcMain.handle('terminal:create', createIPCHandler(
 *   'terminal:create',
 *   async (event, args) => {
 *     const terminal = await createTerminal(args)
 *     return terminal
 *   }
 * ))
 * ```
 *
 * @example Using handler factory
 * ```typescript
 * import { createHandlerFactory } from './middleware'
 *
 * const createTerminalHandler = createHandlerFactory('terminal')
 *
 * ipcMain.handle('terminal:create', createTerminalHandler('create',
 *   async (event, args) => { ... }
 * ))
 * ```
 */

export {
  createIPCHandler,
  createStatusHandler,
  createNoArgsHandler,
  createHandlerFactory,
  extractErrorMessage,
  extractErrorCode,
  type IPCResult,
  type IPCHandler
} from './errorHandler'
