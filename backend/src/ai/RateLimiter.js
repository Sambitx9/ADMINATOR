/**
 * ADMINATOR — Sliding Window Rate Limiter for Gemini Free Tier
 * 
 * Enforces the Google Gemini Free Tier constraint of max 15 requests per minute (RPM).
 * Accurately tracks requests within a rolling 60-second window to prevent 429 quota exhaustion.
 */

export class RateLimiter {
  /**
   * @param {Object} options
   * @param {number} [options.maxRequests=15] - Maximum requests allowed per window (Gemini Free Tier = 15 RPM)
   * @param {number} [options.windowMs=60000] - Rolling window duration in milliseconds (default 60s)
   * @param {string} [options.name='GeminiRateLimiter'] - Identifier
   */
  constructor(options = {}) {
    this.name = options.name || 'GeminiRateLimiter';
    this.maxRequests = options.maxRequests || 15;
    this.windowMs = options.windowMs || 60000;
    this.timestamps = [];
  }

  /**
   * Cleans timestamps older than the active sliding window
   * @private
   * @param {number} now
   */
  _purgeOld(now) {
    const cutoff = now - this.windowMs;
    while (this.timestamps.length > 0 && this.timestamps[0] <= cutoff) {
      this.timestamps.shift();
    }
  }

  /**
   * Attempts to consume one quota unit.
   * @returns {{ allowed: boolean, remaining: number, resetMs: number, totalInWindow: number }}
   */
  tryAcquire() {
    const now = Date.now();
    this._purgeOld(now);

    if (this.timestamps.length < this.maxRequests) {
      this.timestamps.push(now);
      const remaining = this.maxRequests - this.timestamps.length;
      return {
        allowed: true,
        remaining,
        resetMs: 0,
        totalInWindow: this.timestamps.length
      };
    }

    const oldest = this.timestamps[0];
    const resetMs = Math.max(0, (oldest + this.windowMs) - now);
    return {
      allowed: false,
      remaining: 0,
      resetMs,
      totalInWindow: this.timestamps.length
    };
  }

  /**
   * Returns current rate limiter status without consuming a request token
   * @returns {Object}
   */
  getStatus() {
    const now = Date.now();
    this._purgeOld(now);
    const count = this.timestamps.length;
    const oldest = count > 0 ? this.timestamps[0] : null;
    const resetMs = oldest ? Math.max(0, (oldest + this.windowMs) - now) : 0;

    return {
      name: this.name,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      currentUsage: count,
      remaining: Math.max(0, this.maxRequests - count),
      resetMs
    };
  }

  /**
   * Resets rate limiter timestamps (primarily for tests)
   */
  reset() {
    this.timestamps = [];
  }
}

export default RateLimiter;
