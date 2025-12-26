import { ipcMain } from 'electron'
import { ProjectServerManager } from '../fileServer/ProjectServerManager'

export function registerFileServerHandlers(serverManager: ProjectServerManager) {
  // File server operations
  ipcMain.handle('fileServer:getUrl', async (_, { projectId, projectPath, filePath }) => {
    try {
      const url = await serverManager.getFileUrl(projectId, projectPath, filePath)
      return { success: true, url }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('fileServer:stop', async (_, { projectId }) => {
    try {
      await serverManager.stopServer(projectId)
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('fileServer:getStats', async () => {
    try {
      const stats = serverManager.getStats()
      return { success: true, stats }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })
}
