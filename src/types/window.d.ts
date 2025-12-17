import { PluginListItem } from './plugin'

// Extend the Window API interface to include plugins
declare global {
  interface Window {
    api: {
      // ... existing API properties
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
