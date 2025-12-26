import { BrowserWindow, ipcMain } from 'electron'
import { StoreManager } from '../store'
import { fileSystemManager } from '../filesystem'
import { gitManager } from '../git'
import { WorkspaceManager } from '../workspace'

export function registerProjectHandlers(
  window: BrowserWindow,
  storeManager: StoreManager,
  workspaceManager: WorkspaceManager
) {
  // Project management
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

  ipcMain.handle('project:remove', async (_, { id }) => {
    try {
      // Get project path before removing (for security cleanup)
      const project = storeManager.getProjectById(id)

      const success = storeManager.removeProject(id)
      if (success) {
        // Remove project path from allowed filesystem roots (security)
        if (project) {
          fileSystemManager.removeAllowedRoot(project.path)
        }

        // Remove project from all workspaces
        workspaceManager.onProjectDeleted(id)

        // Send filtered projects based on current workspace
        const visibleIds = workspaceManager.getVisibleProjectIds()
        const projects = visibleIds
          ? storeManager.getProjects().filter(p => visibleIds.includes(p.id))
          : storeManager.getProjects()

        window.webContents.send('projects:updated', { projects })
      }
      return { success }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('projects:reorder', async (_, { projectIds }) => {
    try {
      const projects = storeManager.reorderProjects(projectIds)
      window.webContents.send('projects:updated', { projects })
      return { success: true, projects }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('projects:list', async () => {
    try {
      // Filter projects based on current workspace
      const visibleIds = workspaceManager.getVisibleProjectIds()
      const projects = visibleIds
        ? storeManager.getProjects().filter(p => visibleIds.includes(p.id))
        : storeManager.getProjects()
      return { success: true, projects }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })
}
