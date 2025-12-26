import { BrowserWindow, ipcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { PTYManager } from '../pty'
import { StoreManager } from '../store'
import { createIPCHandler } from './middleware'

export function registerTerminalHandlers(
  window: BrowserWindow,
  ptyManager: PTYManager,
  storeManager: StoreManager
) {
  // Throttle terminal name updates to reduce UI flickering
  // For REPL apps like Claude Code CLI that send frequent commands
  const terminalNameThrottle = new Map<string, { lastSent: number; pendingName: string | null; timeout: NodeJS.Timeout | null }>()
  const NAME_UPDATE_THROTTLE_MS = 500 // Only update name every 500ms max

  const sendThrottledNameUpdate = (id: string, name: string) => {
    const now = Date.now()
    let state = terminalNameThrottle.get(id)

    if (!state) {
      state = { lastSent: 0, pendingName: null, timeout: null }
      terminalNameThrottle.set(id, state)
    }

    const timeSinceLastSent = now - state.lastSent

    if (timeSinceLastSent >= NAME_UPDATE_THROTTLE_MS) {
      // Enough time has passed, send immediately
      window.webContents.send('terminal:name-updated', { id, name })
      state.lastSent = now
      state.pendingName = null
      if (state.timeout) {
        clearTimeout(state.timeout)
        state.timeout = null
      }
    } else {
      // Too soon, schedule for later
      state.pendingName = name
      if (!state.timeout) {
        const delay = NAME_UPDATE_THROTTLE_MS - timeSinceLastSent
        state.timeout = setTimeout(() => {
          const currentState = terminalNameThrottle.get(id)
          if (currentState && currentState.pendingName) {
            window.webContents.send('terminal:name-updated', { id, name: currentState.pendingName })
            currentState.lastSent = Date.now()
            currentState.pendingName = null
            currentState.timeout = null
          }
        }, delay)
      }
    }
  }

  // Terminal management
  ipcMain.handle('terminal:create', createIPCHandler(
    'terminal:create',
    async (_, { cwd, shell, projectId, projectName, skipStartupCommand }) => {
      const id = uuidv4()

      // Get current settings to pass to PTY
      const settings = storeManager.getSettings()

      const terminal = ptyManager.create(
        id,
        cwd,
        projectId,
        projectName,
        shell,
        settings,  // Pass settings for login shell mode, etc.
        // onData callback
        (data) => {
          window.webContents.send('terminal:data', { id, data })
        },
        // onExit callback
        (exitCode) => {
          window.webContents.send('terminal:exit', { id, exitCode })
        }
      )

      // Run startup command if enabled in settings (unless explicitly skipped)
      if (!skipStartupCommand && settings.enableStartupCommand && settings.startupCommand) {
        // Wait a bit for the shell to initialize before sending command
        setTimeout(() => {
          if (ptyManager.exists(id)) {
            ptyManager.write(id, `${settings.startupCommand}\r`)
          }
        }, 500)
      }

      return terminal
    }
  ))

  ipcMain.handle('terminal:write', async (_, { id, data }) => {
    try {
      const success = ptyManager.write(id, data)
      // Check if terminal name changed (after command execution)
      // Use throttled update to reduce UI flickering for REPL apps
      if (success && data === '\r') {
        const terminalName = ptyManager.getTerminalName(id)
        if (terminalName) {
          sendThrottledNameUpdate(id, terminalName)
        }
      }
      return { success }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('terminal:resize', async (_, { id, cols, rows }) => {
    try {
      const success = ptyManager.resize(id, cols, rows)
      return { success }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('terminal:kill', async (_, { id }) => {
    try {
      const success = await ptyManager.kill(id)

      // Clean up throttle state to prevent memory leak
      const throttleState = terminalNameThrottle.get(id)
      if (throttleState) {
        if (throttleState.timeout) {
          clearTimeout(throttleState.timeout)
        }
        terminalNameThrottle.delete(id)
      }

      return { success }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })
}
