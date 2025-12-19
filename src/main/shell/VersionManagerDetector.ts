import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { VersionManagerInfo, VersionManagerName } from '../../types'

/**
 * Version manager environment variable definitions
 */
interface VersionManagerDef {
  name: VersionManagerName
  envVars: string[]        // Environment variables to check/preserve
  dirEnvVar?: string       // Main directory env var to check existence
  defaultDir?: string      // Default directory if env var not set
}

/**
 * Detects version managers (nvm, fnm, asdf, etc.) installed on the system
 */
export class VersionManagerDetector {
  private homeDir: string
  private platform: NodeJS.Platform

  // Version manager definitions
  private static readonly VERSION_MANAGERS: VersionManagerDef[] = [
    {
      name: 'nvm',
      envVars: ['NVM_DIR', 'NVM_BIN', 'NVM_INC', 'NVM_CD_FLAGS', 'NVM_RC_VERSION'],
      dirEnvVar: 'NVM_DIR',
      defaultDir: '.nvm'
    },
    {
      name: 'fnm',
      envVars: ['FNM_DIR', 'FNM_MULTISHELL_PATH', 'FNM_VERSION_FILE_STRATEGY', 'FNM_NODE_DIST_MIRROR', 'FNM_LOGLEVEL', 'FNM_ARCH', 'FNM_COREPACK_ENABLED'],
      dirEnvVar: 'FNM_DIR',
      defaultDir: '.fnm'
    },
    {
      name: 'asdf',
      envVars: ['ASDF_DIR', 'ASDF_DATA_DIR', 'ASDF_CONFIG_FILE', 'ASDF_DEFAULT_TOOL_VERSIONS_FILENAME'],
      dirEnvVar: 'ASDF_DIR',
      defaultDir: '.asdf'
    },
    {
      name: 'pyenv',
      envVars: ['PYENV_ROOT', 'PYENV_SHELL', 'PYENV_VERSION', 'PYENV_VIRTUALENV_INIT'],
      dirEnvVar: 'PYENV_ROOT',
      defaultDir: '.pyenv'
    },
    {
      name: 'rbenv',
      envVars: ['RBENV_ROOT', 'RBENV_SHELL', 'RBENV_VERSION'],
      dirEnvVar: 'RBENV_ROOT',
      defaultDir: '.rbenv'
    },
    {
      name: 'volta',
      envVars: ['VOLTA_HOME', 'VOLTA_FEATURE_PNPM'],
      dirEnvVar: 'VOLTA_HOME',
      defaultDir: '.volta'
    }
  ]

  constructor() {
    this.homeDir = os.homedir()
    this.platform = process.platform
  }

  /**
   * Detect all version managers
   */
  async detectAll(): Promise<VersionManagerInfo[]> {
    const results: VersionManagerInfo[] = []

    for (const vmDef of VersionManagerDetector.VERSION_MANAGERS) {
      const info = await this.detectVersionManager(vmDef)
      results.push(info)
    }

    return results
  }

  /**
   * Detect a specific version manager
   */
  private async detectVersionManager(vmDef: VersionManagerDef): Promise<VersionManagerInfo> {
    const envVars: Record<string, string> = {}
    let detected = false

    // Check if version manager is detected via environment variable
    if (vmDef.dirEnvVar && process.env[vmDef.dirEnvVar]) {
      detected = true
      envVars[vmDef.dirEnvVar] = process.env[vmDef.dirEnvVar]!
    }

    // Check default directory if not detected via env var
    if (!detected && vmDef.defaultDir) {
      const defaultPath = path.join(this.homeDir, vmDef.defaultDir)
      try {
        await fs.promises.access(defaultPath, fs.constants.R_OK)
        detected = true
      } catch {
        // Directory doesn't exist
      }
    }

    // Collect all relevant environment variables if detected
    if (detected) {
      for (const envVar of vmDef.envVars) {
        if (process.env[envVar]) {
          envVars[envVar] = process.env[envVar]!
        }
      }
    }

    return {
      name: vmDef.name,
      detected,
      envVars
    }
  }

  /**
   * Get detected version managers only
   */
  async getDetected(): Promise<VersionManagerInfo[]> {
    const all = await this.detectAll()
    return all.filter(vm => vm.detected)
  }

  /**
   * Get environment variables to preserve for detected version managers
   */
  async getEnvVarsToPreserve(): Promise<Record<string, string>> {
    const detected = await this.getDetected()
    const envVars: Record<string, string> = {}

    for (const vm of detected) {
      Object.assign(envVars, vm.envVars)
    }

    return envVars
  }

  /**
   * Get all environment variable names that should be cleaned up
   * when not preserving version managers
   */
  static getEnvVarsToClean(): string[] {
    const allVars: string[] = []
    for (const vmDef of VersionManagerDetector.VERSION_MANAGERS) {
      allVars.push(...vmDef.envVars)
    }
    return [...new Set(allVars)] // Remove duplicates
  }

  /**
   * Check if a specific version manager is detected
   */
  async isDetected(name: VersionManagerName): Promise<boolean> {
    const vmDef = VersionManagerDetector.VERSION_MANAGERS.find(vm => vm.name === name)
    if (!vmDef) return false

    const info = await this.detectVersionManager(vmDef)
    return info.detected
  }
}
