import { BrowserWindow, ipcMain } from 'electron'
import { PluginManager } from '../plugins/PluginManager'

export function registerPluginHandlers(window: BrowserWindow) {
  // Plugin management
  ipcMain.handle('plugins:list', async () => {
    try {
      console.log('[IPC] plugins:list called')
      const pluginManager = PluginManager.getInstance()
      const pluginListItems = await pluginManager.listPluginsAsync()
      console.log('[IPC] Got plugin list items:', pluginListItems)

      // Convert PluginListItem to Plugin format expected by renderer
      const plugins = await Promise.all(
        pluginListItems.map(async item => {
          const plugin = pluginManager.getPlugin(item.id)
          const fullConfig: Record<string, unknown> = plugin
            ? await pluginManager.getPluginConfiguration(item.id).catch(() => ({}))
            : {}

          // Filter config to only include valid fields based on plugin
          // For Minto, only include autoUpdate (remove deprecated githubToken, hasToken)
          const config: Record<string, unknown> = {}
          if (item.id === 'minto') {
            if (fullConfig.autoUpdate !== undefined) {
              config.autoUpdate = fullConfig.autoUpdate
            }
          } else {
            // For other plugins, include all config
            Object.assign(config, fullConfig)
          }

          const result = {
            id: item.id,
            name: item.name,
            description: item.description,
            version: item.latestVersion || item.installedVersion || '0.0.0',
            author: plugin?.definition.author || 'Unknown',
            installed: item.status === 'installed' || item.status === 'update-available',
            installedVersion: item.installedVersion || undefined,
            updateAvailable: item.hasUpdate,
            enabled: item.enabled,
            config,
            tags: item.tags,
            icon: item.icon,
            homepage: plugin?.definition.homepage,
            isBuiltIn: plugin?.definition.isBuiltIn || false
          }
          console.log('[IPC] Converted plugin:', result)
          return result
        })
      )

      console.log('[IPC] Returning plugins:', plugins)
      return { success: true, plugins }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('[IPC] Error in plugins:list:', error)
      return { success: false, error: message }
    }
  })

  ipcMain.handle('plugins:install', async (_, { pluginId }) => {
    try {
      const pluginManager = PluginManager.getInstance()
      const result = await pluginManager.installPlugin(pluginId, (progress) => {
        window.webContents.send('plugins:install-progress', progress)
      })

      // After successful installation, send event to refresh status bar
      if (result.success) {
        window.webContents.send('plugins:status-changed')
      }

      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('plugins:update', async (_, { pluginId }) => {
    try {
      const pluginManager = PluginManager.getInstance()
      const result = await pluginManager.updatePlugin(pluginId, (progress) => {
        window.webContents.send('plugins:update-progress', progress)
      })

      // After successful update, send event to refresh status bar
      if (result.success) {
        window.webContents.send('plugins:status-changed')
      }

      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('plugins:remove', async (_, { pluginId }) => {
    try {
      const pluginManager = PluginManager.getInstance()
      const success = await pluginManager.removePlugin(pluginId)

      // After successful removal, send event to refresh status bar
      if (success) {
        window.webContents.send('plugins:status-changed')
      }

      return { success }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('plugins:configure', async (_, { pluginId, config }) => {
    try {
      const pluginManager = PluginManager.getInstance()
      await pluginManager.configurePlugin(pluginId, config)
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('plugins:getInstallCommand', async (_, { pluginId }) => {
    try {
      const pluginManager = PluginManager.getInstance()
      const plugin = pluginManager.getPlugin(pluginId)
      if (!plugin) {
        return { success: false, error: `Plugin ${pluginId} not found` }
      }

      if (!plugin.installer.getInstallCommand) {
        return { success: false, error: 'Plugin does not support terminal installation' }
      }

      const command = await plugin.installer.getInstallCommand()
      return { success: true, command }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('plugins:getUpdateCommand', async (_, { pluginId }) => {
    try {
      const pluginManager = PluginManager.getInstance()
      const plugin = pluginManager.getPlugin(pluginId)
      if (!plugin) {
        return { success: false, error: `Plugin ${pluginId} not found` }
      }

      if (!plugin.installer.getUpdateCommand) {
        return { success: false, error: 'Plugin does not support terminal update' }
      }

      const command = await plugin.installer.getUpdateCommand()
      return { success: true, command }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('plugins:getCheckUpdateCommand', async (_, { pluginId }) => {
    try {
      const pluginManager = PluginManager.getInstance()
      const plugin = pluginManager.getPlugin(pluginId)
      if (!plugin) {
        return { success: false, error: `Plugin ${pluginId} not found` }
      }

      if (!plugin.installer.getCheckUpdateCommand) {
        return { success: false, error: 'Plugin does not support terminal check' }
      }

      const command = await plugin.installer.getCheckUpdateCommand()
      return { success: true, command }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('plugins:checkForUpdate', async (_, { pluginId }) => {
    try {
      const pluginManager = PluginManager.getInstance()
      const result = await pluginManager.checkForUpdate(pluginId)

      // Notify renderer that plugin status may have changed (e.g., update available)
      if (window && !window.isDestroyed()) {
        window.webContents.send('plugins:status-changed')
      }

      return { success: true, data: result }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('plugins:refreshStatus', async () => {
    try {
      const pluginManager = PluginManager.getInstance()
      await pluginManager.refreshAllPluginsStatus()

      // Note: We intentionally do NOT send 'plugins:status-changed' here
      // because this is a request-response pattern - the caller (PluginPanel)
      // will call plugins:list immediately after this returns.
      // Sending status-changed would cause an infinite loop.

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('plugins:addCustom', async (_, { urlOrPackageName }) => {
    try {
      const pluginManager = PluginManager.getInstance()
      const result = await pluginManager.addCustomPlugin(urlOrPackageName)
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })

  ipcMain.handle('plugins:removeCustom', async (_, { pluginId }) => {
    try {
      const pluginManager = PluginManager.getInstance()
      const result = await pluginManager.removeCustomPlugin(pluginId)
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })
}
