/**
 * ProjectTemplateManager
 *
 * Manages project templates for AiTer.
 * Loads template configurations and applies templates to new projects.
 */

import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Project template configuration
 */
export interface ProjectTemplateConfig {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: 'basic' | 'work' | 'development' | 'enterprise';
  order: number;
  templateDir: string;
  requiredLicense?: string;
}

/**
 * Templates configuration file structure
 */
export interface ProjectTemplatesConfig {
  version: string;
  description?: string;
  templates: ProjectTemplateConfig[];
}

/**
 * Template application result
 */
export interface TemplateApplicationResult {
  success: boolean;
  filesCreated: string[];
  error?: string;
}

export class ProjectTemplateManager {
  private static instance: ProjectTemplateManager | null = null;
  private config: ProjectTemplatesConfig | null = null;
  private configPath: string | null = null;
  private templatesBasePath: string | null = null;

  private constructor() {
    this.loadConfig();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ProjectTemplateManager {
    if (!ProjectTemplateManager.instance) {
      ProjectTemplateManager.instance = new ProjectTemplateManager();
    }
    return ProjectTemplateManager.instance;
  }

  /**
   * Load templates configuration from JSON file
   */
  private loadConfig(): void {
    const configFileName = 'project-templates.json';

    // Possible config paths
    const possiblePaths = [
      // Production: inside app.asar or unpacked
      path.join(app.getAppPath(), 'config', configFileName),
      // Development: project root
      path.join(process.cwd(), 'config', configFileName),
      // Alternative: relative to __dirname
      path.join(__dirname, '..', '..', '..', 'config', configFileName),
    ];

    let configContent: string | null = null;

    for (const tryPath of possiblePaths) {
      try {
        if (fs.existsSync(tryPath)) {
          configContent = fs.readFileSync(tryPath, 'utf-8');
          this.configPath = tryPath;
          this.templatesBasePath = path.join(path.dirname(tryPath), 'templates');
          console.log(`[ProjectTemplateManager] Found config at: ${tryPath}`);
          break;
        }
      } catch (error) {
        console.log(`[ProjectTemplateManager] Config not found at: ${tryPath}`);
      }
    }

    if (!configContent) {
      console.warn('[ProjectTemplateManager] No config file found, using default templates');
      this.config = {
        version: '1.0.0',
        description: 'Default templates',
        templates: [
          {
            id: 'blank',
            name: 'Blank Project',
            description: 'Empty project with basic AI CLI configuration',
            icon: '📁',
            category: 'basic',
            order: 1,
            templateDir: 'blank',
          },
        ],
      };
      return;
    }

    try {
      this.config = JSON.parse(configContent) as ProjectTemplatesConfig;
      console.log(
        `[ProjectTemplateManager] Loaded ${this.config.templates.length} templates`
      );
    } catch (error) {
      console.error('[ProjectTemplateManager] Failed to parse config:', error);
      this.config = {
        version: '1.0.0',
        description: 'Default templates (parse error)',
        templates: [],
      };
    }
  }

  /**
   * Get list of available templates
   */
  public getTemplates(): ProjectTemplateConfig[] {
    if (!this.config) {
      return [];
    }

    // Sort by order
    return [...this.config.templates].sort((a, b) => a.order - b.order);
  }

  /**
   * Get a specific template by ID
   */
  public getTemplate(templateId: string): ProjectTemplateConfig | null {
    if (!this.config) {
      return null;
    }

    return this.config.templates.find((t) => t.id === templateId) || null;
  }

  /**
   * Apply a template to a project directory
   */
  public async applyTemplate(
    templateId: string,
    projectPath: string,
    projectName: string
  ): Promise<TemplateApplicationResult> {
    const template = this.getTemplate(templateId);

    if (!template) {
      return {
        success: false,
        filesCreated: [],
        error: `Template not found: ${templateId}`,
      };
    }

    if (!this.templatesBasePath) {
      return {
        success: false,
        filesCreated: [],
        error: 'Templates base path not configured',
      };
    }

    const templatePath = path.join(this.templatesBasePath, template.templateDir);

    if (!fs.existsSync(templatePath)) {
      console.warn(`[ProjectTemplateManager] Template directory not found: ${templatePath}`);
      // Return success with empty files if template dir doesn't exist
      // This allows the "blank" template to work even without files
      return {
        success: true,
        filesCreated: [],
      };
    }

    const filesCreated: string[] = [];
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    const dateOnly = now.toISOString().substring(0, 10);

    try {
      // Copy all files from template directory
      await this.copyTemplateFiles(
        templatePath,
        projectPath,
        projectName,
        timestamp,
        dateOnly,
        filesCreated
      );

      console.log(
        `[ProjectTemplateManager] Applied template '${templateId}' to ${projectPath}, created ${filesCreated.length} files`
      );

      return {
        success: true,
        filesCreated,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[ProjectTemplateManager] Failed to apply template:', error);
      return {
        success: false,
        filesCreated,
        error: message,
      };
    }
  }

  /**
   * Recursively copy template files with variable substitution
   */
  private async copyTemplateFiles(
    srcDir: string,
    destDir: string,
    projectName: string,
    timestamp: string,
    dateOnly: string,
    filesCreated: string[]
  ): Promise<void> {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        // Create directory if it doesn't exist
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        // Recursively copy contents
        await this.copyTemplateFiles(
          srcPath,
          destPath,
          projectName,
          timestamp,
          dateOnly,
          filesCreated
        );
      } else {
        // Read file content
        let content = fs.readFileSync(srcPath, 'utf-8');

        // Replace template variables
        content = this.replaceTemplateVariables(
          content,
          projectName,
          timestamp,
          dateOnly
        );

        // Write file
        fs.writeFileSync(destPath, content, 'utf-8');
        filesCreated.push(destPath);
      }
    }
  }

  /**
   * Replace template variables in content
   */
  private replaceTemplateVariables(
    content: string,
    projectName: string,
    timestamp: string,
    dateOnly: string
  ): string {
    return content
      .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
      .replace(/\{\{TIMESTAMP\}\}/g, timestamp)
      .replace(/\{\{DATE\}\}/g, dateOnly);
  }

  /**
   * Check if a template exists and has files
   */
  public templateExists(templateId: string): boolean {
    const template = this.getTemplate(templateId);
    if (!template || !this.templatesBasePath) {
      return false;
    }

    const templatePath = path.join(this.templatesBasePath, template.templateDir);
    return fs.existsSync(templatePath);
  }
}
