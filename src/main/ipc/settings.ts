import { BrowserWindow, ipcMain } from 'electron'
import { StoreManager } from '../store'

export function registerSettingsHandlers(
  window: BrowserWindow,
  storeManager: StoreManager
) {
  // Settings management
  ipcMain.handle('settings:get', async () => {
    try {
      const settings = storeManager.getSettings()
      return { success: true, settings }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('settings:update', async (_, settings) => {
    try {
      const updated = storeManager.updateSettings(settings)
      window.webContents.send('settings:updated', { settings: updated })
      return { success: true, settings: updated }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  // Session management
  ipcMain.handle('session:save', async (_, { session }) => {
    try {
      storeManager.saveSession(session)
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('session:get', async () => {
    try {
      const session = storeManager.getSession()
      return { success: true, session }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('session:clear', async () => {
    try {
      storeManager.clearSession()
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })
}
