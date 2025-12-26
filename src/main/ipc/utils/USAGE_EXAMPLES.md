# IPC Handler Utilities - Usage Examples

This document demonstrates how to use the IPC handler utilities to reduce boilerplate code.

## Basic Usage

### Before (with manual error handling)

```typescript
ipcMain.handle('project:add', async (_, { path, name }) => {
  try {
    const project = storeManager.addProject(path, name)
    fileSystemManager.addAllowedRoot(path)
    return { success: true, project }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
})
```

### After (with createHandler)

```typescript
import { createHandler } from './ipc/utils'

ipcMain.handle('project:add', createHandler(async ({ path, name }) => {
  const project = storeManager.addProject(path, name)
  fileSystemManager.addAllowedRoot(path)
  return project
}))
```

**Benefits:**
- Eliminates try-catch boilerplate
- Automatic success/error response formatting
- Consistent error message extraction
- Type-safe with TypeScript generics

---

## Status-Only Handlers

For handlers that only return success/failure (no data):

### Before

```typescript
ipcMain.handle('terminal:resize', async (_, { id, cols, rows }) => {
  try {
    const success = ptyManager.resize(id, cols, rows)
    return { success }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
})
```

### After

```typescript
import { createStatusHandler } from './ipc/utils'

ipcMain.handle('terminal:resize', createStatusHandler(async ({ id, cols, rows }) => {
  return ptyManager.resize(id, cols, rows)
}))
```

---

## No-Arguments Handlers

For handlers that don't take arguments:

### Before

```typescript
ipcMain.handle('projects:list', async () => {
  try {
    const projects = storeManager.getProjects()
    return { success: true, projects }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
})
```

### After

```typescript
import { createNoArgsHandler } from './ipc/utils'

ipcMain.handle('projects:list', createNoArgsHandler(() => {
  return storeManager.getProjects()
}))
```

---

## Rate Limiting

Prevent handlers from being called too frequently:

```typescript
import { createHandler } from './ipc/utils'

ipcMain.handle('terminal:write', createHandler(
  async ({ id, data }) => {
    return ptyManager.write(id, data)
  },
  {
    rateLimit: 50 // Maximum once per 50ms
  }
))
```

**Use cases:**
- Preventing terminal input spam
- Throttling file system operations
- Protecting expensive database queries

---

## Custom Error Handling

Transform errors into user-friendly messages:

```typescript
import { createHandler } from './ipc/utils'

ipcMain.handle('file:read', createHandler(
  async ({ path }) => {
    return await fs.readFile(path, 'utf-8')
  },
  {
    errorTransformer: (error) => {
      if (error instanceof Error) {
        if (error.message.includes('ENOENT')) {
          return 'File not found'
        }
        if (error.message.includes('EACCES')) {
          return 'Permission denied'
        }
      }
      return 'Failed to read file'
    }
  }
))
```

---

## Handler Factory (Shared Configuration)

Create multiple handlers with the same options:

```typescript
import { createHandlerFactory } from './ipc/utils'

// Create factory with shared options
const createProjectHandler = createHandlerFactory({
  logErrors: true,
  errorTransformer: (error) => {
    // Custom project-specific error handling
    return `Project error: ${error instanceof Error ? error.message : 'Unknown'}`
  }
})

// Use factory to create multiple handlers
ipcMain.handle('project:add', createProjectHandler(async ({ path, name }) => {
  return storeManager.addProject(path, name)
}))

ipcMain.handle('project:remove', createProjectHandler(async ({ id }) => {
  return storeManager.removeProject(id)
}))

ipcMain.handle('project:rename', createProjectHandler(async ({ id, name }) => {
  return storeManager.renameProject(id, name)
}))
```

**Benefits:**
- DRY (Don't Repeat Yourself)
- Consistent error handling across related handlers
- Easy to update all handlers at once

---

## Accessing IPC Event Object

Sometimes you need access to the `IpcMainInvokeEvent` (e.g., to get sender info):

```typescript
import { createHandler } from './ipc/utils'

ipcMain.handle('window:info', createHandler(async (args, event) => {
  const webContents = event.sender
  const windowId = webContents.id
  return { windowId, url: webContents.getURL() }
}))
```

---

## TypeScript Type Safety

The wrapper functions are fully typed:

```typescript
import { createHandler, IPCResult } from './ipc/utils'

interface AddProjectArgs {
  path: string
  name: string
}

interface Project {
  id: string
  path: string
  name: string
  createdAt: number
}

// Type-safe handler
ipcMain.handle('project:add', createHandler<AddProjectArgs, Project>(
  async ({ path, name }) => {
    // TypeScript knows the exact types here
    const project = storeManager.addProject(path, name)
    return project // Must return Project type
  }
))

// In renderer process, you get typed responses:
const result: IPCResult<Project> = await window.api.project.add({ path: '/foo', name: 'bar' })
if (result.success) {
  console.log(result.data.id) // TypeScript knows 'data' is Project
}
```

---

## Custom Logging

Replace default console logging with your own logger:

```typescript
import { createHandler } from './ipc/utils'
import { myCustomLogger } from './logger'

ipcMain.handle('critical:operation', createHandler(
  async ({ data }) => {
    return processCriticalData(data)
  },
  {
    logger: (message, level) => {
      // Send to file, remote service, etc.
      myCustomLogger.log(level, message, {
        timestamp: Date.now(),
        module: 'IPC'
      })
    }
  }
))
```

---

## Disabling Error Logging

For handlers where errors are expected (e.g., validation):

```typescript
import { createHandler } from './ipc/utils'

ipcMain.handle('file:exists', createHandler(
  async ({ path }) => {
    // fs.access throws if file doesn't exist
    await fs.access(path)
    return true
  },
  {
    logErrors: false // Don't spam console with expected errors
  }
))
```

---

## Migration Strategy

To migrate existing IPC handlers gradually:

1. **Start with new handlers** - Use `createHandler` for all new IPC endpoints
2. **Refactor high-frequency handlers** - Terminal, file system operations benefit most
3. **Batch refactor by namespace** - Refactor all `project:*` handlers together
4. **Use factory for related handlers** - Group handlers with similar error handling

**Example refactoring order:**
1. Terminal handlers (high frequency) → immediate performance benefit
2. File system handlers (many instances) → significant code reduction
3. Project/Settings handlers (fewer instances) → consistency improvement

---

## Testing with Rate Limits

Clear rate limit cache between tests:

```typescript
import { createHandler, clearRateLimits } from './ipc/utils'

describe('Terminal handler', () => {
  beforeEach(() => {
    clearRateLimits() // Reset all rate limits
  })

  it('should handle rapid writes', async () => {
    // Test code here
  })
})
```

---

## Complete Real-World Example

Here's a complete refactoring of the `project:add` handler:

### Before (59 lines)

```typescript
ipcMain.handle('project:add', async (_, { path, name }) => {
  try {
    // Check if directory is a Git repository
    let isGitRepo = await gitManager.isGitRepo(path)

    // If not a Git repo, initialize one
    if (!isGitRepo) {
      console.log(`Project ${name} is not a Git repository, initializing...`)
      const initSuccess = await gitManager.initRepo(path)
      if (initSuccess) {
        isGitRepo = true
        console.log(`Git repository initialized for ${name}`)
      } else {
        console.warn(`Failed to initialize Git repository for ${name}`)
      }
    }

    const project = storeManager.addProject(path, name)

    // Add project path to allowed filesystem roots (security)
    fileSystemManager.addAllowedRoot(path)

    // Update project with Git status
    project.isGitRepo = isGitRepo

    // Auto-add to current workspace if not the default workspace
    const workspaceId = workspaceManager.getCurrentWorkspaceId()
    if (workspaceId !== 'default') {
      workspaceManager.addProjectToWorkspace(workspaceId, project.id)
    }

    // Send filtered projects based on current workspace
    const visibleIds = workspaceManager.getVisibleProjectIds()
    const projects = visibleIds
      ? storeManager.getProjects().filter(p => visibleIds.includes(p.id))
      : storeManager.getProjects()

    window.webContents.send('projects:updated', { projects })
    return { success: true, project }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: message }
  }
})
```

### After (44 lines, 25% reduction)

```typescript
import { createHandler } from './ipc/utils'

ipcMain.handle('project:add', createHandler(async ({ path, name }) => {
  // Check if directory is a Git repository
  let isGitRepo = await gitManager.isGitRepo(path)

  // If not a Git repo, initialize one
  if (!isGitRepo) {
    console.log(`Project ${name} is not a Git repository, initializing...`)
    const initSuccess = await gitManager.initRepo(path)
    if (initSuccess) {
      isGitRepo = true
      console.log(`Git repository initialized for ${name}`)
    } else {
      console.warn(`Failed to initialize Git repository for ${name}`)
    }
  }

  const project = storeManager.addProject(path, name)

  // Add project path to allowed filesystem roots (security)
  fileSystemManager.addAllowedRoot(path)

  // Update project with Git status
  project.isGitRepo = isGitRepo

  // Auto-add to current workspace if not the default workspace
  const workspaceId = workspaceManager.getCurrentWorkspaceId()
  if (workspaceId !== 'default') {
    workspaceManager.addProjectToWorkspace(workspaceId, project.id)
  }

  // Send filtered projects based on current workspace
  const visibleIds = workspaceManager.getVisibleProjectIds()
  const projects = visibleIds
    ? storeManager.getProjects().filter(p => visibleIds.includes(p.id))
    : storeManager.getProjects()

  window.webContents.send('projects:updated', { projects })
  return project
}))
```

**Improvements:**
- Removed 15 lines of boilerplate
- Clearer business logic (no try-catch noise)
- Automatic error handling with stack traces
- Consistent response format
- Still fully type-safe

---

## Summary

The IPC handler utilities provide:

- **Less boilerplate** - Eliminate repetitive try-catch-return patterns
- **Type safety** - Full TypeScript support with generics
- **Consistency** - Standardized error handling and response format
- **Features** - Built-in rate limiting, error logging, custom transformers
- **Flexibility** - Multiple helper functions for different use cases
- **Maintainability** - Centralized error handling logic

Start using these utilities today to make your IPC code cleaner and more maintainable!
