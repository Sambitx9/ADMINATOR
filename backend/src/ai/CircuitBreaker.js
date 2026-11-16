/**
 * ADMINATOR — Circuit Breaker for AI Gateway
 * 
 * Provides fault isolation for external AI provider calls (Google Gemini Free Tier).
 * Prevents cascading failures, request hanging, and rapid quota exhaustion.
 * 
 * States:
 *   - CLOSED: Normal operation. Requests pass through to AI provider.
 *   - OPEN: Tripped after consecutive failures. Requests immediately fail-fast to deterministic fallback.
 *   - HALF_OPEN: Cooldown elapsed. Allows a single trial request to verify if provider has recovered.
 */

export const CircuitState = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

export class CircuitBreaker {
  /**
   * @param {Object} options
   * @param {number} [options.failureThreshold=3] - Consecutive failures before opening circuit
   * @param {number} [options.cooldownMs=30000] - Cooldown period in ms before attempting HALF_OPEN trial
   * @param {string} [options.name='GeminiCircuitBreaker'] - Breaker identifier
   */
  constructor(options = {}) {
    this.name = options.name || 'GeminiCircuitBreaker';
    this.failureThreshold = options.failureThreshold || 3;
    this.cooldownMs = options.cooldownMs || 30000;

    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.lastError = null;
    this.tripsCount = 0;
  }

  /**
   * Checks whether an execution attempt is allowed.
   * Auto-transitions from OPEN -> HALF_OPEN if cooldown period has elapsed.
   * @returns {boolean}
   */
  canExecute() {
    const now = Date.now();

    if (this.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.state === CircuitState.OPEN) {
      if (this.lastFailureTime && (now - this.lastFailureTime) >= this.cooldownMs) {
        this.state = CircuitState.HALF_OPEN;
        return true;
      }
      return false;
    }

    if (this.state === CircuitState.HALF_OPEN) {
      // Allow probe request
      return true;
    }

    return false;
  }

  /**
   * Records a successful execution.
   * If in HALF_OPEN, closes circuit.
   */
  recordSuccess() {
    this.failures = 0;
    this.lastSuccessTime = Date.now();
    this.lastError = null;

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
    }
  }

  /**
   * Records a failed execution.
   * Trips to OPEN if failures exceed threshold or if failing during HALF_OPEN probe.
   * @param {Error|string} error
   */
  recordFailure(error) {
    this.failures += 1;
    this.lastFailureTime = Date.now();
    this.lastError = error ? (error.message || String(error)) : 'Unknown failure';

    if (this.state === CircuitState.HALF_OPEN || this.failures >= this.failureThreshold) {
      if (this.state !== CircuitState.OPEN) {
        this.tripsCount += 1;
      }
      this.state = CircuitState.OPEN;
    }
  }

  /**
   * Manually trips circuit into OPEN state
   * @param {string} reason
   */
  forceOpen(reason = 'Manual force open') {
    this.state = CircuitState.OPEN;
    this.lastFailureTime = Date.now();
    this.lastError = reason;
    this.tripsCount += 1;
  }

  /**
   * Manually resets circuit into CLOSED state
   */
  forceClosed() {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.lastError = null;
  }

  /**
   * Returns current telemetry and status
   * @returns {Object}
   */
  getState() {
    const now = Date.now();
    const remainingCooldown = (this.state === CircuitState.OPEN && this.lastFailureTime)
      ? Math.max(0, this.cooldownMs - (now - this.lastFailureTime))
      : 0;

    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      failureThreshold: this.failureThreshold,
      cooldownMs: this.cooldownMs,
      remainingCooldownMs: remainingCooldown,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      lastError: this.lastError,
      tripsCount: this.tripsCount
    };
  }

  /**
   * Resets all internal counters and state
   */
  reset() {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.lastError = null;
    this.tripsCount = 0;
  }
}

export default CircuitBreaker;
