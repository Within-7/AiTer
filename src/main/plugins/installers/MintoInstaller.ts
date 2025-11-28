/**
 * MintoInstaller
 *
 * Plugin installer for Minto CLI - AI-powered code generation tool.
 * Handles installation, updates, removal, and GitHub token management.
 *
 * Installation method: Downloads and executes install.sh from GitHub releases
 * Update method: Downloads and executes auto-update.sh
 * Token storage: Encrypted using electron safeStorage when available
 */

import { PluginInstaller, ProgressCallback } from '../../../types/plugin';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import Store from 'electron-store';
import { safeStorage } from 'electron';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

const execFileAsync = promisify(execFile);

interface MintoConfig {
  githubToken?: string;
  autoUpdate?: boolean;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
}

export class MintoInstaller implements PluginInstaller {
  private store: Store;
  private readonly GITHUB_API_BASE = 'https://api.github.com';
  private readonly GITHUB_REPO = 'Within-7/minto';
  private readonly INSTALL_SCRIPT_URL = 'https://raw.githubusercontent.com/Within-7/minto/main/scripts/install.sh';
  private readonly CHECK_UPDATE_SCRIPT_URL = 'https://raw.githubusercontent.com/Within-7/minto/main/scripts/check-update.sh';
  private readonly AUTO_UPDATE_SCRIPT_URL = 'https://raw.githubusercontent.com/Within-7/minto/main/scripts/auto-update.sh';
  private readonly TOKEN_STORE_KEY = 'plugins.minto.token';
  private readonly CONFIG_STORE_KEY = 'plugins.minto.configuration';

  constructor(store: Store) {
    this.store = store;
  }

  /**
   * Check if minto is installed via `which minto` or `where minto`
   */
  async checkInstallation(): Promise<boolean> {
    try {
      const command = process.platform === 'win32' ? 'where' : 'which';
      await execFileAsync(command, ['minto']);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current installed version via `minto --version`
   */
  async getCurrentVersion(): Promise<string | null> {
    try {
      const { stdout } = await execFileAsync('minto', ['--version']);
      // Expected format: "minto version 1.2.3" or just "1.2.3"
      const match = stdout.trim().match(/(\d+\.\d+\.\d+)/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('[MintoInstaller] Error getting current version:', error);
      return null;
    }
  }

  /**
   * Get latest version from GitHub releases API
   */
  async getLatestVersion(): Promise<string | null> {
    try {
      const token = await this.getGitHubToken();
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'AiTer-Plugin-Manager',
      };

      if (token) {
        headers['Authorization'] = `token ${token}`;
      }

      const response = await fetch(
        `${this.GITHUB_API_BASE}/repos/${this.GITHUB_REPO}/releases/latest`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const release: GitHubRelease = await response.json();
      // Remove 'v' prefix if present (e.g., "v1.2.3" -> "1.2.3")
      return release.tag_name.replace(/^v/, '');
    } catch (error) {
      console.error('[MintoInstaller] Error getting latest version:', error);
      return null;
    }
  }

  /**
   * Install minto by downloading and executing install.sh
   */
  async install(progressCallback?: ProgressCallback): Promise<void> {
    progressCallback?.({
      phase: 'checking',
      percentage: 0,
      message: 'Checking prerequisites...',
    });

    // Check if already installed
    const isInstalled = await this.checkInstallation();
    if (isInstalled) {
      throw new Error('Minto is already installed. Use update instead.');
    }

    progressCallback?.({
      phase: 'fetching',
      percentage: 20,
      message: 'Fetching installation script...',
    });

    // Get GitHub token for authentication
    const token = await this.getGitHubToken();
    if (!token) {
      throw new Error('GitHub token is required. Please configure it in plugin settings.');
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'minto-install-'));
    const installScriptPath = path.join(tempDir, 'install.sh');

    try {
      progressCallback?.({
        phase: 'downloading',
        percentage: 40,
        message: 'Downloading installation script...',
      });

      await this.downloadFile(this.INSTALL_SCRIPT_URL, installScriptPath, token);

      // Make script executable
      await fs.chmod(installScriptPath, 0o755);

      progressCallback?.({
        phase: 'installing',
        percentage: 60,
        message: 'Running installation script...',
      });

      // Execute install script using bash with GH_TOKEN environment variable
      await execFileAsync('bash', [installScriptPath], {
        env: { ...process.env, GH_TOKEN: token },
        maxBuffer: 10 * 1024 * 1024,
      });

      progressCallback?.({
        phase: 'verifying',
        percentage: 90,
        message: 'Verifying installation...',
      });

      // Verify installation
      const isNowInstalled = await this.checkInstallation();
      if (!isNowInstalled) {
        throw new Error('Installation completed but minto command not found');
      }

      progressCallback?.({
        phase: 'complete',
        percentage: 100,
        message: 'Installation complete',
      });
    } finally {
      // Clean up temp directory
      await fs.rm(tempDir, { recursive: true, force: true }).catch(console.error);
    }
  }

  /**
   * Update minto by downloading and executing auto-update.sh
   */
  async update(progressCallback?: ProgressCallback): Promise<void> {
    progressCallback?.({
      phase: 'checking',
      percentage: 0,
      message: 'Checking current installation...',
    });

    // Check if installed
    const isInstalled = await this.checkInstallation();
    if (!isInstalled) {
      throw new Error('Minto is not installed. Use install instead.');
    }

    const currentVersion = await this.getCurrentVersion();

    progressCallback?.({
      phase: 'fetching',
      percentage: 20,
      message: 'Checking for updates...',
    });

    // Get GitHub token for authentication
    const token = await this.getGitHubToken();
    if (!token) {
      throw new Error('GitHub token is required. Please configure it in plugin settings.');
    }

    // Get latest version
    const latestVersion = await this.getLatestVersion();
    if (!latestVersion) {
      throw new Error('Could not determine latest version');
    }

    if (currentVersion === latestVersion) {
      progressCallback?.({
        phase: 'complete',
        percentage: 100,
        message: 'Already up to date',
      });
      return;
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'minto-update-'));
    const updateScriptPath = path.join(tempDir, 'auto-update.sh');

    try {
      progressCallback?.({
        phase: 'downloading',
        percentage: 40,
        message: 'Downloading update script...',
      });

      await this.downloadFile(this.AUTO_UPDATE_SCRIPT_URL, updateScriptPath, token);

      // Make script executable
      await fs.chmod(updateScriptPath, 0o755);

      progressCallback?.({
        phase: 'updating',
        percentage: 60,
        message: `Updating to version ${latestVersion}...`,
      });

      // Execute update script using bash with GH_TOKEN environment variable
      await execFileAsync('bash', [updateScriptPath], {
        env: { ...process.env, GH_TOKEN: token },
        maxBuffer: 10 * 1024 * 1024,
      });

      progressCallback?.({
        phase: 'verifying',
        percentage: 90,
        message: 'Verifying update...',
      });

      // Verify new version
      const newVersion = await this.getCurrentVersion();
      if (newVersion !== latestVersion) {
        console.warn(
          `[MintoInstaller] Version mismatch after update: expected ${latestVersion}, got ${newVersion}`
        );
      }

      progressCallback?.({
        phase: 'complete',
        percentage: 100,
        message: 'Update complete',
      });
    } finally {
      // Clean up temp directory
      await fs.rm(tempDir, { recursive: true, force: true }).catch(console.error);
    }
  }

  /**
   * Remove minto from the system
   */
  async remove(progressCallback?: ProgressCallback): Promise<void> {
    progressCallback?.({
      phase: 'checking',
      percentage: 0,
      message: 'Checking installation...',
    });

    const isInstalled = await this.checkInstallation();
    if (!isInstalled) {
      throw new Error('Minto is not installed');
    }

    progressCallback?.({
      phase: 'locating',
      percentage: 30,
      message: 'Locating minto binary...',
    });

    // Find minto binary location
    const command = process.platform === 'win32' ? 'where' : 'which';
    const { stdout } = await execFileAsync(command, ['minto']);
    const mintoPath = stdout.trim().split('\n')[0];

    progressCallback?.({
      phase: 'removing',
      percentage: 60,
      message: 'Removing minto...',
    });

    // Remove binary
    await fs.unlink(mintoPath);

    // Remove config directory if exists
    const configDir = path.join(os.homedir(), '.minto');
    try {
      await fs.access(configDir);
      await fs.rm(configDir, { recursive: true, force: true });
    } catch {
      // Config directory doesn't exist, that's fine
    }

    progressCallback?.({
      phase: 'cleaning',
      percentage: 80,
      message: 'Cleaning up configuration...',
    });

    // Remove stored token
    await this.clearGitHubToken();

    progressCallback?.({
      phase: 'complete',
      percentage: 100,
      message: 'Removal complete',
    });
  }

  /**
   * Configure minto settings (primarily GitHub token)
   */
  async configure(config: Record<string, unknown>): Promise<void> {
    const mintoConfig = config as MintoConfig;

    if (mintoConfig.githubToken !== undefined) {
      if (mintoConfig.githubToken) {
        await this.saveGitHubToken(mintoConfig.githubToken);
      } else {
        await this.clearGitHubToken();
      }
    }

    // Save full configuration
    this.store.set(this.CONFIG_STORE_KEY, config);
  }

  /**
   * Get current configuration
   */
  async getConfiguration(): Promise<Record<string, unknown>> {
    const config = this.store.get(this.CONFIG_STORE_KEY, {}) as MintoConfig;
    const hasToken = await this.hasGitHubToken();

    return {
      ...config,
      githubToken: hasToken ? '***' : undefined, // Don't expose actual token
      hasToken,
    };
  }

  /**
   * Validate configuration
   */
  async validateConfiguration(config: Record<string, unknown>): Promise<boolean | string> {
    const mintoConfig = config as MintoConfig;

    if (mintoConfig.githubToken !== undefined) {
      if (typeof mintoConfig.githubToken !== 'string') {
        return 'GitHub token must be a string';
      }

      if (mintoConfig.githubToken && !mintoConfig.githubToken.startsWith('ghp_')) {
        return 'Invalid GitHub token format (should start with ghp_)';
      }
    }

    return true;
  }

  /**
   * Generate install command for terminal execution
   */
  async getInstallCommand(): Promise<string> {
    const token = await this.getGitHubToken();
    if (!token) {
      throw new Error('GitHub token is required. Please configure it in plugin settings.');
    }

    return `curl -fsSL -H "Authorization: token ${token}" ${this.INSTALL_SCRIPT_URL} | bash`;
  }

  /**
   * Generate update command for terminal execution
   */
  async getUpdateCommand(): Promise<string> {
    const token = await this.getGitHubToken();
    if (!token) {
      throw new Error('GitHub token is required. Please configure it in plugin settings.');
    }

    return `curl -fsSL -H "Authorization: token ${token}" ${this.AUTO_UPDATE_SCRIPT_URL} | bash`;
  }

  /**
   * Generate check update command for terminal execution
   */
  async getCheckUpdateCommand(): Promise<string> {
    const token = await this.getGitHubToken();
    if (!token) {
      throw new Error('GitHub token is required. Please configure it in plugin settings.');
    }

    return `curl -fsSL -H "Authorization: token ${token}" ${this.CHECK_UPDATE_SCRIPT_URL} | bash`;
  }

  // ========== Private Helper Methods ==========

  /**
   * Download file from URL
   */
  private async downloadFile(url: string, destination: string, token?: string): Promise<void> {
    const headers: Record<string, string> = {
      'User-Agent': 'AiTer-Plugin-Manager',
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(destination, buffer);
  }

  // ========== Token Management ==========

  /**
   * Save GitHub token (encrypted if available)
   */
  private async saveGitHubToken(token: string): Promise<void> {
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(token);
      this.store.set(this.TOKEN_STORE_KEY, encrypted.toString('base64'));
    } else {
      console.warn('[MintoInstaller] Encryption not available, storing token in plain text');
      this.store.set(this.TOKEN_STORE_KEY, token);
    }
  }

  /**
   * Get GitHub token (decrypt if encrypted)
   */
  private async getGitHubToken(): Promise<string | undefined> {
    const stored = this.store.get(this.TOKEN_STORE_KEY);
    if (!stored) return undefined;

    if (safeStorage.isEncryptionAvailable() && typeof stored === 'string') {
      try {
        const buffer = Buffer.from(stored, 'base64');
        return safeStorage.decryptString(buffer);
      } catch (error) {
        console.error('[MintoInstaller] Error decrypting token:', error);
        return undefined;
      }
    }

    return stored as string;
  }

  /**
   * Check if GitHub token exists
   */
  private async hasGitHubToken(): Promise<boolean> {
    return this.store.has(this.TOKEN_STORE_KEY);
  }

  /**
   * Clear GitHub token
   */
  private async clearGitHubToken(): Promise<void> {
    this.store.delete(this.TOKEN_STORE_KEY);
  }
}
