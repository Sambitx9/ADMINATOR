/**
 * ADMINATOR — AI Gateway Interface (IAIGateway)
 * 
 * Defines standard contract for pluggable AI providers (Gemini Free Tier, local LLM, etc.)
 * with mandatory grounding, safety boundaries, circuit breaking, and deterministic fallback.
 */

export class IAIGateway {
  constructor(config = {}) {
    if (new.target === IAIGateway) {
      throw new TypeError('Cannot construct IAIGateway directly; use a concrete subclass.');
    }
    this.name = config.name || 'IAIGateway';
    this.enabled = Boolean(config.enabled);
  }

  /**
   * Generates conversational guidance response adhering strictly to admission grounding
   * @param {Object} params
   * @param {string} params.prompt - Candidate user message
   * @param {Object} params.context - Grounding institutional facts (college, branches, fees)
   * @param {string} params.language - Target language ('en' | 'or' | 'hi')
   * @param {Array} params.history - Recent sanitized conversation history
   * @param {Object} [params.options] - Optional overrides (timeout, model)
   * @returns {Promise<Object>} { text: string, model: string, usage: Object, language: string }
   */
  async generateResponse(params) {
    throw new Error('generateResponse() must be implemented by subclass.');
  }

  /**
   * Returns whether the gateway is currently ready and able to process requests
   * @returns {boolean}
   */
  isHealthy() {
    throw new Error('isHealthy() must be implemented by subclass.');
  }

  /**
   * Returns telemetry, circuit breaker state, and rate limit statistics
   * @returns {Object}
   */
  getStatus() {
    throw new Error('getStatus() must be implemented by subclass.');
  }

  /**
   * Resets circuit breaker and rate limiter state (primarily for automated testing)
   */
  reset() {
    throw new Error('reset() must be implemented by subclass.');
  }
}

export default IAIGateway;