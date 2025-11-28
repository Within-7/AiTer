import crypto from 'crypto'
import { LocalFileServer } from './LocalFileServer'
import { PortManager } from './PortManager'

interface ServerInfo {
  server: LocalFileServer
  accessToken: string
  lastAccessed: number
}

/**
 * Manages file servers for all projects with LRU eviction policy
 */
export class ProjectServerManager {
  private servers: Map<string, ServerInfo> = new Map()
  private portManager: PortManager
  private readonly MAX_ACTIVE_SERVERS = 10 // Maximum concurrent servers
  private readonly IDLE_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
  private idleCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    this.portManager = new PortManager()
    this.startIdleMonitor()
  }

  /**
   * Generate a secure random access token
   */
  private generateAccessToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Start monitoring for idle servers
   */
  private startIdleMonitor() {
    // Check every minute for idle servers
    this.idleCheckInterval = setInterval(() => {
      this.checkAndCloseIdleServers()
    }, 60 * 1000)
  }

  /**
   * Check and close idle servers that haven't been accessed recently
   */
  private async checkAndCloseIdleServers() {
    const now = Date.now()
    const serversToClose: string[] = []

    this.servers.forEach((info, projectId) => {
      const idleTime = now - info.server.getLastAccessed()
      if (idleTime > this.IDLE_TIMEOUT_MS) {
        serversToClose.push(projectId)
      }
    })

    if (serversToClose.length > 0) {
      console.log(`[ProjectServerManager] Closing ${serversToClose.length} idle servers`)
      for (const projectId of serversToClose) {
        await this.stopServer(projectId)
      }
    }
  }

  /**
   * Evict the least recently used server if we've reached the limit
   */
  private async evictLRUServer() {
    if (this.servers.size < this.MAX_ACTIVE_SERVERS) {
      return
    }

    // Find the least recently accessed server
    let lruProjectId: string | null = null
    let oldestAccess = Infinity

    this.servers.forEach((info, projectId) => {
      if (info.server.getLastAccessed() < oldestAccess) {
        oldestAccess = info.server.getLastAccessed()
        lruProjectId = projectId
      }
    })

    if (lruProjectId) {
      console.log(`[ProjectServerManager] Evicting LRU server for project ${lruProjectId}`)
      await this.stopServer(lruProjectId)
    }
  }

  /**
   * Get or start a server for a project
   */
  public async getServer(projectId: string, projectPath: string): Promise<LocalFileServer> {
    // If server already exists and is running, return it
    const existing = this.servers.get(projectId)
    if (existing && existing.server.isRunning()) {
      console.log(`[ProjectServerManager] Reusing existing server for project ${projectId}`)
      return existing.server
    }

    // Evict LRU server if needed
    await this.evictLRUServer()

    // Create new server
    const accessToken = this.generateAccessToken()
    const server = new LocalFileServer(projectId, projectPath, accessToken)

    // Allocate port and start server
    const port = await this.portManager.allocatePort(projectId)
    await server.start(port)

    // Store server info
    this.servers.set(projectId, {
      server,
      accessToken,
      lastAccessed: Date.now()
    })

    console.log(`[ProjectServerManager] Started new server for project ${projectId} on port ${port}`)
    return server
  }

  /**
   * Get server URL for a specific file
   */
  public async getFileUrl(
    projectId: string,
    projectPath: string,
    filePath: string
  ): Promise<string> {
    const server = await this.getServer(projectId, projectPath)
    return server.getUrl(filePath)
  }

  /**
   * Stop a specific project server
   */
  public async stopServer(projectId: string): Promise<void> {
    const serverInfo = this.servers.get(projectId)
    if (serverInfo) {
      await serverInfo.server.stop()
      this.servers.delete(projectId)
      console.log(`[ProjectServerManager] Stopped server for project ${projectId}`)
    }
  }

  /**
   * Stop all servers
   */
  public async stopAllServers(): Promise<void> {
    console.log(`[ProjectServerManager] Stopping all ${this.servers.size} servers`)

    const stopPromises = Array.from(this.servers.keys()).map(projectId =>
      this.stopServer(projectId)
    )

    await Promise.all(stopPromises)

    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval)
      this.idleCheckInterval = null
    }
  }

  /**
   * Get server info for a project (if running)
   */
  public getServerInfo(projectId: string): { port: number; url: string } | null {
    const serverInfo = this.servers.get(projectId)
    if (serverInfo && serverInfo.server.isRunning()) {
      return {
        port: serverInfo.server.getPort(),
        url: serverInfo.server.getUrl()
      }
    }
    return null
  }

  /**
   * Get statistics about running servers
   */
  public getStats(): {
    activeServers: number
    maxServers: number
    projects: Array<{ projectId: string; port: number; lastAccessed: Date }>
  } {
    const projects = Array.from(this.servers.entries()).map(([projectId, info]) => ({
      projectId,
      port: info.server.getPort(),
      lastAccessed: new Date(info.server.getLastAccessed())
    }))

    return {
      activeServers: this.servers.size,
      maxServers: this.MAX_ACTIVE_SERVERS,
      projects
    }
  }
}
