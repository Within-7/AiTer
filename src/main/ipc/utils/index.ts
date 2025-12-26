/**
 * IPC Handler Utilities
 *
 * Provides wrapper functions to reduce boilerplate code in IPC handlers.
 * Automatically handles error catching, response formatting, and optional features
 * like rate limiting and error logging.
 */

export {
  createHandler,
  createStatusHandler,
  createNoArgsHandler,
  createHandlerFactory,
  clearRateLimits,
  type IPCHandler,
  type IPCResult,
  type HandlerOptions
} from './handler'
