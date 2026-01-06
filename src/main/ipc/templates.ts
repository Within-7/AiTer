/**
 * Template IPC Handlers
 *
 * Handles template-related IPC communication between main and renderer processes.
 */

import { ipcMain } from 'electron';
import { ProjectTemplateManager } from '../templates/ProjectTemplateManager';

export function registerTemplateHandlers() {
  const templateManager = ProjectTemplateManager.getInstance();

  // Get list of available templates
  ipcMain.handle('templates:list', async () => {
    try {
      const templates = templateManager.getTemplates();
      return { success: true, templates };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[IPC] templates:list error:', error);
      return { success: false, error: message };
    }
  });

  // Get a specific template
  ipcMain.handle('templates:get', async (_, { templateId }) => {
    try {
      const template = templateManager.getTemplate(templateId);
      if (!template) {
        return { success: false, error: `Template not found: ${templateId}` };
      }
      return { success: true, template };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[IPC] templates:get error:', error);
      return { success: false, error: message };
    }
  });

  // Apply template to a project (internal use, called from project:add)
  ipcMain.handle('templates:apply', async (_, { templateId, projectPath, projectName }) => {
    try {
      const result = await templateManager.applyTemplate(templateId, projectPath, projectName);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[IPC] templates:apply error:', error);
      return { success: false, filesCreated: [], error: message };
    }
  });

  console.log('[IPC] Template handlers registered');
}
