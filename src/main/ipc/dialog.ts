import { BrowserWindow, ipcMain, dialog } from 'electron'

export function registerDialogHandlers(window: BrowserWindow) {
  // File system dialogs
  ipcMain.handle('dialog:openFolder', async () => {
    try {
      const result = await dialog.showOpenDialog(window, {
        properties: ['openDirectory', 'createDirectory']
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: true, data: null }
      }

      const path = result.filePaths[0]
      const name = path.split('/').pop() || path.split('\\').pop() || 'Unnamed'

      return { success: true, data: { path, name } }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('dialog:openFiles', async () => {
    try {
      const result = await dialog.showOpenDialog(window, {
        properties: ['openFile', 'multiSelections']
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: true, data: null }
      }

      return { success: true, data: { paths: result.filePaths } }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })
}
