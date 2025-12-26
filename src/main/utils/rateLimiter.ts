/**
 * Rate Limiter Implementation
 * Uses sliding window algorithm to track requests per time window
 */

interface RateLimiterOptions {
  maxRequests: number;    // Maximum requests allowed per window
  windowMs: number;       // Time window in milliseconds
  burstLimit?: number;    // Optional burst limit (defaults to maxRequests)
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

/**
 * Rate limiter using sliding window algorithm
 */
export class RateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly burstLimit: number;
  private readonly requests: Map<string, RequestRecord[]>;

  // Statistics
  private totalRequests = 0;
  private totalBlocked = 0;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
    this.burstLimit = options.burstLimit ?? options.maxRequests;
    this.requests = new Map();

    // Cleanup old records every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if a request should be allowed
   * @param key - Unique identifier for the requester (e.g., channel name)
   * @returns true if request is allowed, false if rate limit exceeded
   */
  checkLimit(key: string): boolean {
    this.totalRequests++;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or initialize request records for this key
    let records = this.requests.get(key);
    if (!records) {
      records = [];
      this.requests.set(key, records);
    }

    // Remove expired records (outside the sliding window)
    const validRecords = records.filter(r => r.timestamp > windowStart);
    this.requests.set(key, validRecords);

    // Calculate total requests in current window
    const requestCount = validRecords.reduce((sum, r) => sum + r.count, 0);

    // Check burst limit (instantaneous)
    const recentBurst = validRecords
      .filter(r => r.timestamp > now - 1000) // Last 1 second
      .reduce((sum, r) => sum + r.count, 0);

    if (recentBurst >= this.burstLimit) {
      this.totalBlocked++;
      return false;
    }

    // Check rate limit (sliding window)
    if (requestCount >= this.maxRequests) {
      this.totalBlocked++;
      return false;
    }

    // Add new request record
    validRecords.push({
      timestamp: now,
      count: 1
    });

    return true;
  }

  /**
   * Clean up old records to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, records] of this.requests.entries()) {
      const validRecords = records.filter(r => r.timestamp > windowStart);

      if (validRecords.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRecords);
      }
    }
  }

  /**
   * Get statistics about rate limiting
   */
  getStats(): { totalRequests: number; totalBlocked: number; blockRate: number } {
    const blockRate = this.totalRequests > 0
      ? (this.totalBlocked / this.totalRequests) * 100
      : 0;

    return {
      totalRequests: this.totalRequests,
      totalBlocked: this.totalBlocked,
      blockRate: parseFloat(blockRate.toFixed(2))
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.totalRequests = 0;
    this.totalBlocked = 0;
  }

  /**
   * Get current request count for a specific key
   */
  getCurrentCount(key: string): number {
    const records = this.requests.get(key);
    if (!records) return 0;

    const now = Date.now();
    const windowStart = now - this.windowMs;

    return records
      .filter(r => r.timestamp > windowStart)
      .reduce((sum, r) => sum + r.count, 0);
  }
}

/**
 * Pre-configured rate limiters for different operation types
 */
export const rateLimiters = {
  fileOperations: new RateLimiter({
    maxRequests: 50,
    windowMs: 1000,
    burstLimit: 20
  }),

  searchOperations: new RateLimiter({
    maxRequests: 10,
    windowMs: 1000,
    burstLimit: 5
  }),

  terminalOperations: new RateLimiter({
    maxRequests: 100,
    windowMs: 1000,
    burstLimit: 50
  }),

  projectOperations: new RateLimiter({
    maxRequests: 30,
    windowMs: 1000,
    burstLimit: 15
  }),

  generalOperations: new RateLimiter({
    maxRequests: 60,
    windowMs: 1000,
    burstLimit: 30
  })
};

/**
 * Log rate limiter statistics periodically
 */
export function startRateLimiterStatsLogging(intervalMs = 300000): NodeJS.Timeout {
  return setInterval(() => {
    console.log('[Rate Limiter Stats]');
    console.log('  File Operations:', rateLimiters.fileOperations.getStats());
    console.log('  Search Operations:', rateLimiters.searchOperations.getStats());
    console.log('  Terminal Operations:', rateLimiters.terminalOperations.getStats());
    console.log('  Project Operations:', rateLimiters.projectOperations.getStats());
    console.log('  General Operations:', rateLimiters.generalOperations.getStats());
  }, intervalMs);
}
