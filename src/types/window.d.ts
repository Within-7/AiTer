import { PluginListItem } from './plugin'
import { DetectedShell, VersionManagerInfo, ShellType } from './index'

// Extend the Window API interface to include plugins, shell detection, and version managers
declare global {
  interface Window {
    api: {
      // ... existing API properties
      shell: {
        openExternal(url: string): Promise<{ success: boolean; error?: string }>
        openPath(path: string): Promise<{ success: boolean; error?: string }>
        detectAvailable(): Promise<{ success: boolean; shells?: DetectedShell[]; error?: string }>
        getConfigFiles(shellType: ShellType): Promise<{ success: boolean; files?: string[]; error?: string }>
        getDefaultShell(): Promise<{ success: boolean; defaultShell?: string; error?: string }>
      }
      versionManager: {
        detect(): Promise<{ success: boolean; managers?: VersionManagerInfo[]; error?: string }>
        getDetected(): Promise<{ success: boolean; managers?: VersionManagerInfo[]; error?: string }>
      }
      plugins?: {
        list(): Promise<{
          success: boolean
          plugins?: PluginListItem[]
          error?: string
        }>
        install(pluginId: string): Promise<{
          success: boolean
          version?: string
          error?: string
        }>
        update(pluginId: string): Promise<{
          success: boolean
          version?: string
          error?: string
        }>
        remove(pluginId: string): Promise<{
          success: boolean
          error?: string
        }>
        configure(
          pluginId: string,
          config: Record<string, unknown>
        ): Promise<{
          success: boolean
          error?: string
        }>
        getConfiguration(pluginId: string): Promise<{
          success: boolean
          config?: Record<string, unknown>
          error?: string
        }>
        checkUpdates(): Promise<{
          success: boolean
          updates?: Array<{
            pluginId: string
            currentVersion: string
            latestVersion: string
          }>
          error?: string
        }>
        onInstallProgress(
          callback: (event: {
            pluginId: string
            progress: number
            phase: string
            message: string
          }) => void
        ): () => void
        onUpdateProgress(
          callback: (event: {
            pluginId: string
            progress: number
            phase: string
            message: string
          }) => void
        ): () => void
        onInitialized(callback: () => void): () => void
        onStatusChanged(callback: () => void): () => void
      }
    }
  }
}

export {}
