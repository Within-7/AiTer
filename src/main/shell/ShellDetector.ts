import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { DetectedShell, ShellType } from '../../types'

/**
 * Cross-platform shell detection system
 * Detects available shells and their configuration files
 */
export class ShellDetector {
  private platform: NodeJS.Platform
  private homeDir: string

  constructor() {
    this.platform = process.platform
    this.homeDir = os.homedir()
  }

  /**
   * Get the system default shell
   */
  getDefaultShell(): string {
    if (this.platform === 'win32') {
      return process.env.COMSPEC || 'C:\\Windows\\System32\\cmd.exe'
    }
    return process.env.SHELL || '/bin/bash'
  }

  /**
   * Detect all available shells on the system
   */
  async detectAvailableShells(): Promise<DetectedShell[]> {
    if (this.platform === 'win32') {
      return this.detectWindowsShells()
    }
    return this.detectUnixShells()
  }

  /**
   * Detect shells on macOS/Linux
   */
  private async detectUnixShells(): Promise<DetectedShell[]> {
    const shells: DetectedShell[] = []
    const defaultShell = this.getDefaultShell()

    // Common shell paths to check
    const shellPaths = [
      { path: '/bin/zsh', name: 'Zsh', type: 'zsh' as ShellType },
      { path: '/bin/bash', name: 'Bash', type: 'bash' as ShellType },
      { path: '/usr/bin/zsh', name: 'Zsh', type: 'zsh' as ShellType },
      { path: '/usr/bin/bash', name: 'Bash', type: 'bash' as ShellType },
      { path: '/usr/local/bin/fish', name: 'Fish', type: 'fish' as ShellType },
      { path: '/opt/homebrew/bin/fish', name: 'Fish', type: 'fish' as ShellType },
      { path: '/usr/local/bin/zsh', name: 'Zsh (Homebrew)', type: 'zsh' as ShellType },
      { path: '/opt/homebrew/bin/zsh', name: 'Zsh (Homebrew)', type: 'zsh' as ShellType },
      { path: '/opt/homebrew/bin/bash', name: 'Bash (Homebrew)', type: 'bash' as ShellType }
    ]

    // Try to read /etc/shells for a complete list
    try {
      const etcShells = await fs.promises.readFile('/etc/shells', 'utf-8')
      const lines = etcShells.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))

      for (const shellPath of lines) {
        if (!shellPaths.some(s => s.path === shellPath)) {
          const shellName = path.basename(shellPath)
          const type = this.getShellType(shellName)
          shellPaths.push({
            path: shellPath,
            name: this.formatShellName(shellName),
            type
          })
        }
      }
    } catch {
      // /etc/shells might not exist, continue with defaults
    }

    // Check which shells exist
    for (const shell of shellPaths) {
      try {
        await fs.promises.access(shell.path, fs.constants.X_OK)
        const isDefault = shell.path === defaultShell
        const configFiles = this.getConfigFiles(shell.type, shell.path)

        // Avoid duplicates (same type from different paths)
        const existingIndex = shells.findIndex(s => s.type === shell.type && !s.path.includes('homebrew'))
        if (existingIndex >= 0 && !shell.path.includes('homebrew')) {
          continue
        }

        shells.push({
          name: shell.name,
          path: shell.path,
          type: shell.type,
          isDefault,
          configFiles
        })
      } catch {
        // Shell doesn't exist or isn't executable
      }
    }

    // Sort: default shell first, then alphabetically
    shells.sort((a, b) => {
      if (a.isDefault) return -1
      if (b.isDefault) return 1
      return a.name.localeCompare(b.name)
    })

    return shells
  }

  /**
   * Detect shells on Windows
   */
  private async detectWindowsShells(): Promise<DetectedShell[]> {
    const shells: DetectedShell[] = []
    const defaultShell = this.getDefaultShell()

    // Windows shell paths to check
    const shellPaths = [
      // CMD
      {
        path: process.env.COMSPEC || 'C:\\Windows\\System32\\cmd.exe',
        name: 'Command Prompt',
        type: 'cmd' as ShellType
      },
      // PowerShell 7 (cross-platform)
      {
        path: 'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
        name: 'PowerShell 7',
        type: 'pwsh' as ShellType
      },
      // Windows PowerShell (built-in)
      {
        path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
        name: 'Windows PowerShell',
        type: 'powershell' as ShellType
      },
      // Git Bash
      {
        path: 'C:\\Program Files\\Git\\bin\\bash.exe',
        name: 'Git Bash',
        type: 'gitbash' as ShellType
      },
      {
        path: 'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
        name: 'Git Bash',
        type: 'gitbash' as ShellType
      },
      // WSL
      {
        path: 'C:\\Windows\\System32\\wsl.exe',
        name: 'WSL',
        type: 'wsl' as ShellType
      }
    ]

    for (const shell of shellPaths) {
      try {
        await fs.promises.access(shell.path, fs.constants.X_OK)
        const isDefault = shell.path.toLowerCase() === defaultShell.toLowerCase()
        const configFiles = this.getConfigFiles(shell.type, shell.path)

        // Avoid duplicates
        if (shells.some(s => s.type === shell.type)) {
          continue
        }

        shells.push({
          name: shell.name,
          path: shell.path,
          type: shell.type,
          isDefault,
          configFiles
        })
      } catch {
        // Shell doesn't exist
      }
    }

    // Sort: default shell first, then alphabetically
    shells.sort((a, b) => {
      if (a.isDefault) return -1
      if (b.isDefault) return 1
      return a.name.localeCompare(b.name)
    })

    return shells
  }

  /**
   * Get configuration files for a shell type
   */
  getConfigFiles(shellType: ShellType, shellPath?: string): string[] {
    const home = this.homeDir

    switch (shellType) {
      case 'zsh':
        return [
          path.join(home, '.zprofile'),
          path.join(home, '.zshrc'),
          path.join(home, '.zshenv'),
          path.join(home, '.zlogin')
        ].filter(f => this.fileExists(f))

      case 'bash':
        return [
          path.join(home, '.bash_profile'),
          path.join(home, '.bashrc'),
          path.join(home, '.profile')
        ].filter(f => this.fileExists(f))

      case 'fish':
        return [
          path.join(home, '.config', 'fish', 'config.fish')
        ].filter(f => this.fileExists(f))

      case 'powershell':
      case 'pwsh':
        // PowerShell profile locations
        const psProfiles = [
          path.join(home, 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1'),
          path.join(home, 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1')
        ]
        return psProfiles.filter(f => this.fileExists(f))

      case 'gitbash':
        return [
          path.join(home, '.bash_profile'),
          path.join(home, '.bashrc')
        ].filter(f => this.fileExists(f))

      case 'wsl':
        // WSL uses its own ~/.bashrc or ~/.zshrc inside the Linux environment
        return []

      case 'cmd':
        // CMD doesn't have a standard config file (uses registry AutoRun)
        return []

      default:
        return []
    }
  }

  /**
   * Check if a file exists synchronously
   */
  private fileExists(filePath: string): boolean {
    try {
      fs.accessSync(filePath, fs.constants.R_OK)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get shell type from shell name
   */
  private getShellType(shellName: string): ShellType {
    const name = shellName.toLowerCase()
    if (name.includes('zsh')) return 'zsh'
    if (name.includes('bash')) return 'bash'
    if (name.includes('fish')) return 'fish'
    if (name.includes('pwsh')) return 'pwsh'
    if (name.includes('powershell')) return 'powershell'
    if (name.includes('cmd')) return 'cmd'
    return 'other'
  }

  /**
   * Format shell name for display
   */
  private formatShellName(shellName: string): string {
    const name = shellName.toLowerCase()
    if (name === 'zsh') return 'Zsh'
    if (name === 'bash') return 'Bash'
    if (name === 'fish') return 'Fish'
    if (name === 'sh') return 'Bourne Shell'
    if (name === 'dash') return 'Dash'
    if (name === 'ksh') return 'Korn Shell'
    if (name === 'tcsh') return 'Tcsh'
    if (name === 'csh') return 'C Shell'
    return shellName.charAt(0).toUpperCase() + shellName.slice(1)
  }

  /**
   * Get shell arguments for login mode
   */
  getLoginArgs(shellType: ShellType): string[] {
    switch (shellType) {
      case 'zsh':
      case 'bash':
      case 'fish':
      case 'gitbash':
        return ['-l']

      case 'powershell':
      case 'pwsh':
        // PowerShell loads profile by default, -NoLogo reduces startup noise
        return ['-NoLogo']

      case 'cmd':
        // CMD doesn't have a login mode concept
        return []

      case 'wsl':
        // WSL can use --login
        return ['--login']

      default:
        return []
    }
  }

  /**
   * Check if a shell supports login mode
   */
  supportsLoginMode(shellType: ShellType): boolean {
    return ['zsh', 'bash', 'fish', 'gitbash', 'wsl'].includes(shellType)
  }
}
