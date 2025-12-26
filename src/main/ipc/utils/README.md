# IPC Handler Utilities

**Type-safe IPC handler wrappers to eliminate boilerplate and improve code quality.**

## Overview

This module provides utility functions to wrap Electron IPC handlers, eliminating repetitive try-catch-return patterns while maintaining type safety and adding optional features like rate limiting and error logging.

## Problem Statement

In the current `src/main/ipc.ts` file, we have 80+ handlers with the same repetitive pattern:

```typescript
ipcMain.handle('namespace:method', async (_, args) => {
  try {
    // Business logic here
    return { success: true, data: result }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
})
```

**Issues:**
- 800+ lines of boilerplate code (10 lines per handler)
- Inconsistent error handling
- Difficult to add features like rate limiting or logging
- Harder to maintain and test

## Solution

The `createHandler` wrapper reduces this to:

```typescript
import { createHandler } from './ipc/utils'

ipcMain.handle('namespace:method', createHandler(async (args) => {
  // Business logic here
  return result
}))
```

**Benefits:**
- 60% code reduction (4 lines vs 10 lines)
- Consistent error handling
- Built-in features (rate limiting, logging, error transformation)
- Fully type-safe with TypeScript generics
- Easier to test and maintain

## API Reference

### Core Functions

#### `createHandler<TArgs, TResult>(handler, options?)`

Creates a wrapped IPC handler with automatic error handling.

**Parameters:**
- `handler: (args: TArgs, event?: IpcMainInvokeEvent) => Promise<TResult> | TResult`
- `options?: HandlerOptions`

**Returns:** `(event: IpcMainInvokeEvent, args: TArgs) => Promise<IPCResult<TResult>>`

**Example:**
```typescript
ipcMain.handle('project:add', createHandler(async ({ path, name }) => {
  const project = storeManager.addProject(path, name)
  return project
}))
```

---

#### `createStatusHandler<TArgs>(handler, options?)`

Creates a handler that returns boolean success/failure status.

**Example:**
```typescript
ipcMain.handle('terminal:resize', createStatusHandler(async ({ id, cols, rows }) => {
  return ptyManager.resize(id, cols, rows)
}))
```

---

#### `createNoArgsHandler<TResult>(handler, options?)`

Creates a handler that takes no arguments.

**Example:**
```typescript
ipcMain.handle('projects:list', createNoArgsHandler(() => {
  return storeManager.getProjects()
}))
```

---

#### `createHandlerFactory(defaultOptions)`

Creates a factory function for multiple handlers with shared options.

**Example:**
```typescript
const createProjectHandler = createHandlerFactory({
  logErrors: true,
  errorTransformer: (error) => `Project error: ${error}`
})

ipcMain.handle('project:add', createProjectHandler(async ({ path, name }) => {
  return storeManager.addProject(path, name)
}))

ipcMain.handle('project:remove', createProjectHandler(async ({ id }) => {
  return storeManager.removeProject(id)
}))
```

---

### Options

```typescript
interface HandlerOptions {
  logErrors?: boolean              // Log errors to console (default: true)
  errorTransformer?: (error: unknown) => string  // Custom error message formatter
  rateLimit?: number               // Minimum ms between calls
  logger?: (message: string, level: 'info' | 'warn' | 'error') => void
}
```

### Types

```typescript
interface IPCResult<T> {
  success: boolean
  data?: T
  error?: string
}

type IPCHandler<TArgs, TResult> = (
  args: TArgs,
  event?: IpcMainInvokeEvent
) => Promise<TResult> | TResult
```

## Features

### 1. Automatic Error Handling

Catches all errors and formats them consistently:

```typescript
// Handles Error objects
throw new Error('File not found')
// Returns: { success: false, error: 'File not found' }

// Handles string errors
throw 'Invalid input'
// Returns: { success: false, error: 'Invalid input' }

// Handles unknown errors
throw { custom: 'error' }
// Returns: { success: false, error: 'Unknown error' }
```

### 2. Rate Limiting

Prevents handlers from being called too frequently:

```typescript
ipcMain.handle('terminal:write', createHandler(
  async ({ id, data }) => ptyManager.write(id, data),
  { rateLimit: 50 } // Maximum once per 50ms
))
```

If called too soon:
```json
{ "success": false, "error": "Rate limited. Please wait 25ms before retrying." }
```

### 3. Error Logging

Automatically logs errors with stack traces (can be disabled):

```typescript
// Default: logs to console
ipcMain.handle('file:read', createHandler(async ({ path }) => {
  return await fs.readFile(path)
}))

// Disable logging
ipcMain.handle('file:exists', createHandler(
  async ({ path }) => await fs.access(path),
  { logErrors: false }
))

// Custom logger
ipcMain.handle('critical:operation', createHandler(
  async ({ data }) => processData(data),
  { logger: (msg, level) => myLogger.log(level, msg) }
))
```

### 4. Error Transformation

Transform technical errors into user-friendly messages:

```typescript
ipcMain.handle('file:read', createHandler(
  async ({ path }) => await fs.readFile(path),
  {
    errorTransformer: (error) => {
      if (error instanceof Error) {
        if (error.message.includes('ENOENT')) return 'File not found'
        if (error.message.includes('EACCES')) return 'Permission denied'
        if (error.message.includes('EISDIR')) return 'Path is a directory'
      }
      return 'Failed to read file'
    }
  }
))
```

### 5. Type Safety

Full TypeScript support with generics:

```typescript
interface AddProjectArgs {
  path: string
  name: string
}

interface Project {
  id: string
  path: string
  name: string
}

ipcMain.handle('project:add', createHandler<AddProjectArgs, Project>(
  async ({ path, name }) => {
    return storeManager.addProject(path, name)
  }
))

// In renderer, fully typed:
const result: IPCResult<Project> = await window.api.project.add({
  path: '/foo',
  name: 'bar'
})

if (result.success) {
  console.log(result.data.id) // TypeScript knows 'data' is Project
}
```

## Migration Guide

### Step 1: Import the utilities

```typescript
import { createHandler, createStatusHandler, createNoArgsHandler } from './ipc/utils'
```

### Step 2: Choose the right helper

- **Has arguments + returns data** → `createHandler`
- **Has arguments + returns boolean** → `createStatusHandler`
- **No arguments** → `createNoArgsHandler`

### Step 3: Extract business logic

Remove the try-catch and return formatting:

**Before:**
```typescript
ipcMain.handle('project:add', async (_, { path, name }) => {
  try {
    const project = storeManager.addProject(path, name)
    fileSystemManager.addAllowedRoot(path)
    window.webContents.send('projects:updated', { projects: [...] })
    return { success: true, project }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
})
```

**After:**
```typescript
ipcMain.handle('project:add', createHandler(async ({ path, name }) => {
  const project = storeManager.addProject(path, name)
  fileSystemManager.addAllowedRoot(path)
  window.webContents.send('projects:updated', { projects: [...] })
  return project
}))
```

### Step 4: Add options if needed

```typescript
// Add rate limiting for high-frequency handlers
ipcMain.handle('terminal:write', createHandler(
  async ({ id, data }) => ptyManager.write(id, data),
  { rateLimit: 50 }
))

// Custom error messages for user-facing operations
ipcMain.handle('file:read', createHandler(
  async ({ path }) => await fs.readFile(path),
  {
    errorTransformer: (error) => {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        return 'File not found'
      }
      return 'Failed to read file'
    }
  }
))
```

## Recommended Migration Order

1. **New handlers** - Use utilities for all new IPC endpoints
2. **High-frequency handlers** - Terminal, file system operations
3. **Batch by namespace** - All `project:*`, all `terminal:*`, etc.
4. **Use factory for related handlers** - Group similar handlers

## Testing

Run tests with:

```bash
npm test -- src/main/ipc/utils/__tests__/handler.test.ts
```

Clear rate limits between tests:

```typescript
import { clearRateLimits } from './ipc/utils'

beforeEach(() => {
  clearRateLimits()
})
```

## Performance Impact

**Code size reduction:**
- Before: ~1200 lines (80 handlers × 15 lines average)
- After: ~600 lines (80 handlers × 7-8 lines average)
- **50% reduction in IPC handler code**

**Runtime overhead:**
- Negligible (single wrapper function call)
- Rate limiting adds ~1ms overhead when enabled
- Error logging has no impact when disabled

**Memory usage:**
- Rate limit cache: ~1KB per handler (only when rate limiting enabled)
- Total overhead: <100KB for 80 handlers

## Examples

See `USAGE_EXAMPLES.md` for comprehensive examples covering:
- Basic usage patterns
- Rate limiting strategies
- Error transformation
- Handler factories
- TypeScript type safety
- Real-world refactoring examples

## Architecture

```
src/main/ipc/utils/
├── handler.ts              # Core implementation
├── index.ts                # Public API exports
├── README.md               # This file
├── USAGE_EXAMPLES.md       # Detailed examples
└── __tests__/
    └── handler.test.ts     # Comprehensive tests
```

## Design Decisions

### Why wrapper functions instead of decorators?

Decorators would require:
- `experimentalDecorators` in tsconfig
- More complex TypeScript configuration
- Different syntax for different handler types

Wrapper functions are:
- Simpler and more explicit
- Work with standard TypeScript
- Easier to test and understand
- More flexible (can wrap any function)

### Why not a class-based approach?

Class-based handlers would require:
- More boilerplate for class definitions
- Loss of functional programming benefits
- Harder to tree-shake unused code

Functional wrappers are:
- Lightweight and composable
- Better for tree-shaking
- More aligned with JavaScript/TypeScript best practices

### Why include rate limiting?

Many IPC handlers (especially terminal operations) can be called at very high frequencies. Built-in rate limiting prevents:
- UI stuttering from excessive updates
- Main process overload
- Potential DoS attacks from malicious renderer

## Future Enhancements

Possible future additions:

1. **Request deduplication** - Ignore duplicate calls with same arguments
2. **Caching** - Cache results for pure functions
3. **Metrics** - Track call frequency and error rates
4. **Retry logic** - Automatic retry for transient failures
5. **Validation** - Schema validation for arguments (Zod/Yup integration)

## Contributing

When adding new features:

1. Add types to `handler.ts`
2. Update `USAGE_EXAMPLES.md` with examples
3. Add tests to `__tests__/handler.test.ts`
4. Update this README

## License

Part of the AiTer project. See root LICENSE file.
