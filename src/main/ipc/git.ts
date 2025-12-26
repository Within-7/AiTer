import { ipcMain } from 'electron'
import { gitManager } from '../git'

export function registerGitHandlers() {
  // Git management
  ipcMain.handle('git:getStatus', async (_, { projectPath }) => {
    try {
      const status = await gitManager.getStatus(projectPath)
      return { success: true, status }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('git:getRecentCommits', async (_, { projectPath, count }) => {
    try {
      const commits = await gitManager.getRecentCommits(projectPath, count || 10)
      return { success: true, commits }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('git:initRepo', async (_, { projectPath }) => {
    try {
      const success = await gitManager.initRepo(projectPath)
      return { success }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('git:getFileChanges', async (_, { projectPath }) => {
    try {
      const changes = await gitManager.getFileChanges(projectPath)
      return { success: true, changes }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('git:commitAll', async (_, { projectPath, message }) => {
    try {
      const success = await gitManager.commitAll(projectPath, message)
      return { success }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  })

  ipcMain.handle('git:getBranches', async (_, { projectPath }) => {
    try {
      const branches = await gitManager.getBranches(projectPath)
      return { success: true, branches }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('git:createBranch', async (_, { projectPath, branchName }) => {
    try {
      const success = await gitManager.createBranch(projectPath, branchName)
      return { success }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('git:switchBranch', async (_, { projectPath, branchName }) => {
    try {
      const success = await gitManager.switchBranch(projectPath, branchName)
      return { success }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('git:deleteBranch', async (_, { projectPath, branchName, force }) => {
    try {
      const success = await gitManager.deleteBranch(projectPath, branchName, force)
      return { success }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('git:pull', async (_, { projectPath }) => {
    try {
      const success = await gitManager.pull(projectPath)
      return { success }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('git:push', async (_, { projectPath }) => {
    try {
      const success = await gitManager.push(projectPath)
      return { success }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('git:fetch', async (_, { projectPath }) => {
    try {
      const success = await gitManager.fetch(projectPath)
      return { success }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('git:stageFile', async (_, { projectPath, filePath }) => {
    try {
      const success = await gitManager.stageFile(projectPath, filePath)
      return { success }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('git:unstageFile', async (_, { projectPath, filePath }) => {
    try {
      const success = await gitManager.unstageFile(projectPath, filePath)
      return { success }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('git:getFileDiff', async (_, { projectPath, filePath }) => {
    try {
      const diff = await gitManager.getFileDiff(projectPath, filePath)
      return { success: true, diff }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('git:getCommitFiles', async (_, { projectPath, commitHash }) => {
    try {
      const files = await gitManager.getCommitFiles(projectPath, commitHash)
      return { success: true, files }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('git:getCommitFileDiff', async (_, { projectPath, commitHash, filePath }) => {
    try {
      const diff = await gitManager.getCommitFileDiff(projectPath, commitHash, filePath)
      return { success: true, diff }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })
}
