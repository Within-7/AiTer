import getPort from 'get-port'
import Store from 'electron-store'

interface PortMapping {
  [projectId: string]: number
}

/**
 * Manages port allocation for project file servers
 * Persists port mappings to ensure consistency across restarts
 */
export class PortManager {
  private store: Store<{ ports: PortMapping }>
  private allocatedPorts: Map<string, number> = new Map()
  private readonly PORT_RANGE_START = 3000
  private readonly PORT_RANGE_END = 4000

  constructor() {
    this.store = new Store<{ ports: PortMapping }>({
      name: 'port-manager',
      defaults: {
        ports: {}
      }
    })

    // Load persisted port mappings
    this.loadPersistedPorts()
  }

  private loadPersistedPorts() {
    const savedPorts = this.store.get('ports', {})
    Object.entries(savedPorts).forEach(([projectId, port]) => {
      this.allocatedPorts.set(projectId, port)
    })
    console.log(`[PortManager] Loaded ${this.allocatedPorts.size} persisted port mappings`)
  }

  private persistPorts() {
    const portsObject: PortMapping = {}
    this.allocatedPorts.forEach((port, projectId) => {
      portsObject[projectId] = port
    })
    this.store.set('ports', portsObject)
  }

  /**
   * Check if a port is available
   */
  private async isPortAvailable(port: number): Promise<boolean> {
    try {
      const availablePort = await getPort({ port })
      return availablePort === port
    } catch {
      return false
    }
  }

  /**
   * Allocate a port for a project
   * Tries to reuse the previously allocated port if available
   */
  public async allocatePort(projectId: string): Promise<number> {
    // Check if we have a saved port for this project
    const savedPort = this.allocatedPorts.get(projectId)

    if (savedPort && await this.isPortAvailable(savedPort)) {
      console.log(`[PortManager] Reusing saved port ${savedPort} for project ${projectId}`)
      return savedPort
    }

    // Allocate a new port in the specified range
    try {
      // Generate array of ports in range [3000, 3001, 3002, ..., 4000]
      const portRange = Array.from(
        { length: this.PORT_RANGE_END - this.PORT_RANGE_START + 1 },
        (_, i) => this.PORT_RANGE_START + i
      )

      const port = await getPort({
        port: portRange
      })

      this.allocatedPorts.set(projectId, port)
      this.persistPorts()

      console.log(`[PortManager] Allocated new port ${port} for project ${projectId}`)
      return port
    } catch (error) {
      console.error(`[PortManager] Failed to allocate port for project ${projectId}:`, error)
      throw new Error(`Failed to allocate port: ${error}`)
    }
  }

  /**
   * Release a port allocation
   */
  public releasePort(projectId: string): void {
    if (this.allocatedPorts.has(projectId)) {
      const port = this.allocatedPorts.get(projectId)
      console.log(`[PortManager] Released port ${port} for project ${projectId}`)
      // Note: We keep the mapping in case the project is restarted
      // This ensures URL stability
    }
  }

  /**
   * Get the allocated port for a project (if any)
   */
  public getPort(projectId: string): number | undefined {
    return this.allocatedPorts.get(projectId)
  }

  /**
   * Clear all port mappings (useful for testing)
   */
  public clearAllPorts(): void {
    this.allocatedPorts.clear()
    this.store.set('ports', {})
    console.log('[PortManager] Cleared all port mappings')
  }
}
