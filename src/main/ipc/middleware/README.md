# IPC Error Handling Middleware

This directory contains unified error handling middleware for all Electron IPC handlers in AiTer.

## Overview

The error handling middleware provides:

- **Automatic error catching**: No need for try-catch blocks in every handler
- **Standardized response format**: Consistent `IPCResult<T>` interface
- **Structured logging**: Integration with `src/main/utils/logger.ts`
- **Error codes**: Categorize errors with error codes for better debugging
- **Stack traces**: Automatic stack trace logging in debug mode
- **Type safety**: Full TypeScript support with generics

## Files

- **errorHandler.ts**: Core middleware implementation
- **index.ts**: Public API exports
- **README.md**: This documentation file

## Usage

### Basic Handler

Replace manual try-catch blocks with the `createIPCHandler` wrapper:

**Before:**
```typescript
ipcMain.handle('terminal:create', async (_, args) => {
  try {
    const terminal = await createTerminal(args)
    return { success: true, terminal }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
})
```

**After:**
```typescript
import { createIPCHandler } from './middleware'

ipcMain.handle('terminal:create', createIPCHandler(
  'terminal:create',
  async (event, args) => {
    const terminal = await createTerminal(args)
    return terminal  // Just return the data, no need to wrap
  }
))
```

### Status Handler

For handlers that return only success/failure (boolean):

```typescript
import { createStatusHandler } from './middleware'

ipcMain.handle('terminal:resize', createStatusHandler(
  'terminal:resize',
  async (event, { id, cols, rows }) => {
    return ptyManager.resize(id, cols, rows)
  }
))
```

### No-Args Handler

For handlers with no arguments:

```typescript
import { createNoArgsHandler } from './middleware'

ipcMain.handle('projects:list', createNoArgsHandler(
  'projects:list',
  async (event) => {
    return storeManager.getProjects()
  }
))
```

### Handler Factory

Create multiple handlers with a shared namespace:

```typescript
import { createHandlerFactory } from './middleware'

const createTerminalHandler = createHandlerFactory('terminal')

ipcMain.handle('terminal:create', createTerminalHandler(
  'create',
  async (event, args) => {
    // Handler logic
    return terminal
  }
))

ipcMain.handle('terminal:write', createTerminalHandler(
  'write',
  async (event, { id, data }) => {
    return ptyManager.write(id, data)
  }
))
```

## Response Format

All handlers wrapped with the middleware return a standardized `IPCResult<T>`:

```typescript
interface IPCResult<T = unknown> {
  success: boolean    // true if handler succeeded, false if error occurred
  data?: T           // The result data (only present on success)
  error?: string     // Error message (only present on failure)
  code?: string      // Error code (only present on failure)
}
```

## Error Logging

The middleware automatically logs errors using the structured logger:

```typescript
logger.error('IPC', `Handler error [terminal:create]`, {
  handler: 'terminal:create',
  error: 'Terminal creation failed',
  code: 'PTY_ERROR'
})
```

Stack traces are logged in debug mode:

```typescript
logger.debug('IPC', `Stack trace [terminal:create]`, {
  stack: error.stack
})
```

## Error Codes

Error codes are automatically extracted from:

1. **Error name**: For `Error` instances (e.g., `TypeError`, `RangeError`)
2. **Custom code**: For objects with a `code` property
3. **Default**: `UNKNOWN_ERROR` for untyped errors

Example:

```typescript
// This will produce error code 'PTY_ERROR'
class PTYError extends Error {
  name = 'PTY_ERROR'
}

// This will also produce error code 'FILE_NOT_FOUND'
const error = {
  message: 'File does not exist',
  code: 'FILE_NOT_FOUND'
}
```

## Benefits

### 1. Reduced Boilerplate

**Before (14 lines):**
```typescript
ipcMain.handle('terminal:create', async (_, args) => {
  try {
    const id = uuidv4()
    const terminal = ptyManager.create(id, args.cwd, ...)
    return { success: true, terminal }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[IPC Error] terminal:create:', message)
    return { success: false, error: message }
  }
})
```

**After (7 lines):**
```typescript
ipcMain.handle('terminal:create', createIPCHandler(
  'terminal:create',
  async (event, args) => {
    const id = uuidv4()
    const terminal = ptyManager.create(id, args.cwd, ...)
    return terminal
  }
))
```

### 2. Consistent Error Handling

All errors are handled the same way across the entire codebase.

### 3. Better Debugging

Structured logs with error codes make it easier to track down issues:

```
[2025-12-26 10:30:45.123] [ERROR] [IPC] Handler error [terminal:create] | handler=terminal:create, error=PTY creation failed, code=PTY_ERROR
[2025-12-26 10:30:45.124] [DEBUG] [IPC] Stack trace [terminal:create] | stack=Error: PTY creation failed\n    at PTYManager.create (/app/src/main/pty.ts:123:11)
```

### 4. Type Safety

Full TypeScript support with generic types:

```typescript
interface CreateTerminalArgs {
  cwd: string
  shell?: string
  projectId: string
}

interface Terminal {
  id: string
  cwd: string
  shell: string
  projectId: string
}

ipcMain.handle('terminal:create', createIPCHandler<CreateTerminalArgs, Terminal>(
  'terminal:create',
  async (event, args) => {
    // args is typed as CreateTerminalArgs
    // return type must be Terminal
    return terminal
  }
))
```

## Migration Guide

To migrate existing IPC handlers to use the middleware:

1. Import the appropriate handler creator:
   ```typescript
   import { createIPCHandler } from './middleware'
   ```

2. Wrap your handler:
   ```typescript
   ipcMain.handle('namespace:method', createIPCHandler(
     'namespace:method',
     async (event, args) => {
       // Your existing handler logic
     }
   ))
   ```

3. Remove try-catch blocks and response wrapping:
   - Remove `try { ... } catch (error) { ... }`
   - Remove `return { success: true, data: ... }`
   - Just `return` the data directly

4. Test the handler to ensure it still works correctly

## Advanced Features

### Custom Error Types

Create custom error classes for better error categorization:

```typescript
class TerminalNotFoundError extends Error {
  name = 'TERMINAL_NOT_FOUND'
  constructor(id: string) {
    super(`Terminal with ID ${id} not found`)
  }
}

ipcMain.handle('terminal:write', createIPCHandler(
  'terminal:write',
  async (event, { id, data }) => {
    const terminal = ptyManager.get(id)
    if (!terminal) {
      throw new TerminalNotFoundError(id)
    }
    return ptyManager.write(id, data)
  }
))
```

This will automatically log with error code `TERMINAL_NOT_FOUND`.

### Error Context

Add additional context to errors for better debugging:

```typescript
class ValidationError extends Error {
  name = 'VALIDATION_ERROR'
  context: Record<string, unknown>

  constructor(message: string, context: Record<string, unknown>) {
    super(message)
    this.context = context
  }
}

ipcMain.handle('project:add', createIPCHandler(
  'project:add',
  async (event, { path, name }) => {
    if (!path || !name) {
      throw new ValidationError('Invalid project data', { path, name })
    }
    return storeManager.addProject(path, name)
  }
))
```

## See Also

- **src/main/utils/logger.ts**: Structured logging utilities
- **src/main/ipc/utils/handler.ts**: Alternative handler utilities with rate limiting
- **src/preload/index.ts**: Preload API definitions
- **CLAUDE.md**: IPC communication pattern documentation
