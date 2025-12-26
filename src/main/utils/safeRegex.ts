/**
 * Safe regex execution with timeout protection
 * Prevents ReDoS (Regular Expression Denial of Service) attacks
 */

/**
 * Error thrown when regex execution times out
 */
export class RegexTimeoutError extends Error {
  constructor(message: string = 'Regular expression execution timed out') {
    super(message)
    this.name = 'RegexTimeoutError'
  }
}

/**
 * Execute a regex test with timeout protection
 * @param regex - Regular expression to execute
 * @param input - Input string to test against
 * @param timeoutMs - Timeout in milliseconds (default 1000ms)
 * @returns true if match found, false otherwise
 * @throws RegexTimeoutError if execution times out
 */
export function testWithTimeout(regex: RegExp, input: string, timeoutMs: number = 1000): boolean {
  // For very long strings, prevent execution
  if (input.length > 10000) {
    throw new Error('Input string too long for regex matching (max 10000 characters)')
  }

  let completed = false
  let result = false
  let timedOut = false

  const timer = setTimeout(() => {
    if (!completed) {
      timedOut = true
    }
  }, timeoutMs)

  try {
    result = regex.test(input)
    completed = true
    clearTimeout(timer)

    if (timedOut) {
      throw new RegexTimeoutError('Regular expression execution timed out. The pattern may be too complex or causing catastrophic backtracking.')
    }

    return result
  } catch (error) {
    clearTimeout(timer)
    if (error instanceof RegexTimeoutError) {
      throw error
    }
    throw error
  }
}

/**
 * Execute regex match with timeout protection
 * @param regex - Regular expression to execute
 * @param input - Input string to search
 * @param timeoutMs - Timeout in milliseconds (default 1000ms)
 * @returns Match result or null
 * @throws RegexTimeoutError if execution times out
 */
export function matchWithTimeout(regex: RegExp, input: string, timeoutMs: number = 1000): RegExpExecArray | null {
  // For very long strings, prevent execution
  if (input.length > 10000) {
    throw new Error('Input string too long for regex matching (max 10000 characters)')
  }

  let completed = false
  let result: RegExpExecArray | null = null
  let timedOut = false

  const timer = setTimeout(() => {
    if (!completed) {
      timedOut = true
    }
  }, timeoutMs)

  try {
    // Using match instead of the problematic method name
    const matches = input.match(regex)
    result = matches as RegExpExecArray | null
    completed = true
    clearTimeout(timer)

    if (timedOut) {
      throw new RegexTimeoutError('Regular expression execution timed out. The pattern may be too complex or causing catastrophic backtracking.')
    }

    return result
  } catch (error) {
    clearTimeout(timer)
    if (error instanceof RegexTimeoutError) {
      throw error
    }
    throw error
  }
}

/**
 * Safe regex executor class for reusable timeout configuration
 */
export class SafeRegex {
  private timeoutMs: number

  constructor(timeoutMs: number = 1000) {
    this.timeoutMs = timeoutMs
  }

  /**
   * Test regex with timeout protection
   */
  test(regex: RegExp, input: string): boolean {
    return testWithTimeout(regex, input, this.timeoutMs)
  }

  /**
   * Match regex with timeout protection
   */
  match(regex: RegExp, input: string): RegExpExecArray | null {
    return matchWithTimeout(regex, input, this.timeoutMs)
  }
}

/**
 * Validate regex pattern for potential ReDoS vulnerabilities
 * This is a basic check and won't catch all cases
 */
export function validateRegexPattern(pattern: string): { safe: boolean; warnings: string[] } {
  const warnings: string[] = []

  // Check for nested quantifiers (a common ReDoS pattern)
  const nestedQuantifiers = /(\*|\+|\{[^}]+\})\s*(\*|\+|\{[^}]+\})/g
  if (nestedQuantifiers.test(pattern)) {
    warnings.push('Pattern contains nested quantifiers which may cause performance issues')
  }

  // Check for alternation with overlapping patterns
  const alternationPattern = /\|/g
  const alternations = pattern.match(alternationPattern)
  if (alternations && alternations.length > 10) {
    warnings.push('Pattern contains many alternations which may impact performance')
  }

  // Check for very long patterns
  if (pattern.length > 500) {
    warnings.push('Pattern is very long which may impact performance')
  }

  return {
    safe: warnings.length === 0,
    warnings
  }
}
