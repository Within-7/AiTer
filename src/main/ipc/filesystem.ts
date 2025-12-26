import { ipcMain } from 'electron'
import { fileSystemManager } from '../filesystem'

export function registerFilesystemHandlers() {
  // File system operations
  ipcMain.handle('fs:readDir', async (_, { path, depth }) => {
    try {
      const nodes = await fileSystemManager.readDirectory(path, depth || 1)
      return { success: true, nodes }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('fs:readFile', async (_, { path }) => {
    try {
      const result = await fileSystemManager.readFile(path)
      return { success: true, ...result }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('fs:writeFile', async (_, { path, content }) => {
    try {
      const success = await fileSystemManager.writeFile(path, content)
      return { success }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('fs:fileExists', async (_, { path }) => {
    try {
      const exists = await fileSystemManager.fileExists(path)
      return { success: true, exists }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('fs:createFile', async (_, { path, content }) => {
    try {
      const success = await fileSystemManager.createFile(path, content || '')
      return { success }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('fs:createDirectory', async (_, { path }) => {
    try {
      const success = await fileSystemManager.createDirectory(path)
      return { success }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('fs:rename', async (_, { oldPath, newPath }) => {
    try {
      const success = await fileSystemManager.rename(oldPath, newPath)
      return { success }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('fs:delete', async (_, { path }) => {
    try {
      const success = await fileSystemManager.delete(path)
      return { success }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('fs:copyFiles', async (_, { sourcePaths, destDir }) => {
    try {
      const result = await fileSystemManager.copyFiles(sourcePaths, destDir)
      return { success: true, ...result }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  // File search operations
  ipcMain.handle('fs:searchFiles', async (_, { projectPath, pattern, options }) => {
    try {
      const results = await fileSystemManager.searchFiles(projectPath, pattern, options)
      return { success: true, results }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('fs:searchContent', async (_, { projectPath, pattern, options }) => {
    try {
      const results = await fileSystemManager.searchContent(projectPath, pattern, options)
      return { success: true, results }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })
}
