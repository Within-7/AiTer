/**
 * Concurrency limiter for controlling parallel async operations
 * Prevents resource exhaustion (e.g., EMFILE errors) when processing many files
 */
export class ConcurrencyLimiter {
  private queue: Array<() => Promise<void>> = []
  private activeCount = 0
  private readonly maxConcurrent: number

  /**
   * Create a concurrency limiter
   * @param maxConcurrent - Maximum number of concurrent operations (default: 10)
   */
  constructor(maxConcurrent: number = 10) {
    if (maxConcurrent < 1) {
      throw new Error('maxConcurrent must be at least 1')
    }
    this.maxConcurrent = maxConcurrent
  }

  /**
   * Run an async function with concurrency limiting
   * @param fn - Async function to execute
   * @returns Promise that resolves when the function completes
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    // If we're under the limit, execute immediately
    if (this.activeCount < this.maxConcurrent) {
      return this.execute(fn)
    }

    // Otherwise, queue the function
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await this.execute(fn)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  /**
   * Execute a function and manage the queue
   */
  private async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.activeCount++
    try {
      return await fn()
    } finally {
      this.activeCount--
      this.processQueue()
    }
  }

  /**
   * Process the next item in the queue if possible
   */
  private processQueue(): void {
    if (this.queue.length === 0) return
    if (this.activeCount >= this.maxConcurrent) return

    const next = this.queue.shift()
    if (next) {
      next()
    }
  }

  /**
   * Get current active count (for debugging/monitoring)
   */
  getActiveCount(): number {
    return this.activeCount
  }

  /**
   * Get current queue length (for debugging/monitoring)
   */
  getQueueLength(): number {
    return this.queue.length
  }

  /**
   * Wait for all active operations to complete
   * Useful for graceful shutdown
   */
  async waitForAll(): Promise<void> {
    while (this.activeCount > 0 || this.queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }
}
