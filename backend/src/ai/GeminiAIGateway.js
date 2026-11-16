/**
 * ADMINATOR — Google Gemini Free Tier AI Gateway Adapter
 * 
 * Implements IAIGateway for Google Gemini 1.5 Flash / Pro (Free Tier).
 * Features:
 *   - Native fetch with AbortController timeout (5000ms)
 *   - Strict in-memory sliding window rate limiter (15 RPM)
 *   - Circuit breaker fault isolation (CLOSED -> OPEN -> HALF_OPEN)
 *   - Automatic PII redacting (zero student phone/email leakage)
 *   - Strict grounding prompt against verified college and fee catalog
 */

import { IAIGateway } from './IAIGateway.js';
import { CircuitBreaker } from './CircuitBreaker.js';
import { RateLimiter } from './RateLimiter.js';

export class GeminiAIGateway extends IAIGateway {
  /**
   * @param {Object} [config]
   * @param {string} [config.apiKey] - Google Gemini API Key
   * @param {string} [config.model] - Model name (default: gemini-1.5-flash)
   * @param {number} [config.timeoutMs] - Request timeout in ms (default: 5000)
   * @param {CircuitBreaker} [config.circuitBreaker] - Injected or custom circuit breaker
   * @param {RateLimiter} [config.rateLimiter] - Injected or custom rate limiter
   */
  constructor(config = {}) {
    super({ name: 'GeminiAIGateway', enabled: Boolean(config.apiKey || process.env.GEMINI_API_KEY) });

    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || null;
    this.model = config.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.timeoutMs = config.timeoutMs || parseInt(process.env.GEMINI_TIMEOUT_MS, 10) || 5000;
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';

    this.circuitBreaker = config.circuitBreaker || new CircuitBreaker({
      name: 'GeminiCircuitBreaker',
      failureThreshold: 3,
      cooldownMs: 30000
    });

    this.rateLimiter = config.rateLimiter || new RateLimiter({
      name: 'GeminiRateLimiter',
      maxRequests: 15, // 15 RPM free tier
      windowMs: 60000
    });
  }

  /**
   * Sanitizes text to remove student PII (phone numbers, emails)
   * Invariant: Never send private student contact details to external AI
   * @param {string} text
   * @returns {string}
   */
  sanitizePII(text = '') {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/\b[6-9]\d{9}\b/g, '[REDACTED_PHONE]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g, '[REDACTED_EMAIL]')
      .replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, '[REDACTED_ID]');
  }

  /**
   * Prepares grounding system instructions based on authoritative DB context
   * @param {Object} context
   * @param {string} language
   * @returns {string}
   */
  buildSystemInstruction(context = {}, language = 'en') {
    const collegeName = context.collegeName || 'DRIEMS Polytechnic (Autonomous), Tangi, Cuttack, Odisha';
    const branches = context.branches && context.branches.length > 0
      ? context.branches.join(', ')
      : 'Mechanical Engineering, Civil Engineering, Computer Science & Engineering, Electrical Engineering, Electronics & Telecommunication, Automobile Engineering';
    
    const fees = context.feeSummary || 'Tuition Fee ~₹35,000/yr (Demo). Hostel ~₹30,000/yr (Demo). Official fees subject to admission office confirmation.';

    return `You are ADMINATOR AI, an intelligent, empathetic admission counsellor for ${collegeName}.

GROUNDING RULES (STRICT AND NON-NEGOTIABLE):
1. You may ONLY recommend verified diploma programmes available at the college: ${branches}.
2. ELIGIBILITY RULES:
   - 1st Year Diploma: Minimum 35% aggregate in 10th standard / Matriculation. Mathematics, Science, and English required. Age minimum 14 years.
   - Lateral Entry (2nd Year): Minimum 35% in +2 Science (with PCM) or 2-year ITI in relevant trade.
   - NEVER invent or alter marks thresholds or seat reservation criteria.
3. FEES & SCHOLARSHIPS:
   - Reference baseline: ${fees}.
   - Never promise unapproved fee waivers or fake discounts. State clearly that fees are indicative demo values.
4. LANGUAGE & CULTURAL SENSITIVITY:
   - Respond strictly in the candidate's active language: "${language}" (en = English, hi = Hindi in Devanagari, or = Odia in Odia script).
   - If the candidate uses colloquial Hinglish or Odlish, respond warmly in the same accessible style with proper respect and clarity.
5. CONCISENESS & CLARITY:
   - Keep answers focused (2-4 clear sentences or bullet points).
   - If candidate asks to speak with a human counsellor or asks questions outside diploma admissions, guide them to connect with the admission desk.`;
  }

  /**
   * Generates conversational guidance response adhering strictly to admission grounding
   * @param {Object} params
   * @param {string} params.prompt - Candidate user message
   * @param {Object} params.context - Grounding institutional facts (college, branches, fees)
   * @param {string} params.language - Target language ('en' | 'or' | 'hi')
   * @param {Array} [params.history] - Recent sanitized conversation history
   * @param {Object} [params.options] - Optional overrides (timeout, model)
   * @returns {Promise<Object>} { text: string, model: string, usage: Object, language: string, engineUsed: 'AI_GEMINI' }
   */
  async generateResponse(params) {
    const { prompt, context = {}, language = 'en', history = [], options = {} } = params;

    // 1. Invariant: Check API Key
    const activeKey = options.apiKey || this.apiKey || process.env.GEMINI_API_KEY;
    if (!activeKey) {
      const err = new Error('MISSING_API_KEY: Gemini API key is not configured.');
      err.code = 'MISSING_API_KEY';
      throw err;
    }

    // 2. Circuit Breaker Pre-Flight Check
    if (!this.circuitBreaker.canExecute()) {
      const err = new Error('CIRCUIT_BREAKER_OPEN: AI Gateway circuit breaker is currently OPEN.');
      err.code = 'CIRCUIT_BREAKER_OPEN';
      throw err;
    }

    // 3. Sliding Window Rate Limiter Check (15 RPM free tier)
    const rateCheck = this.rateLimiter.tryAcquire();
    if (!rateCheck.allowed) {
      const err = new Error(`RATE_LIMIT_EXCEEDED: Free-tier rate limit (15 RPM) exceeded. Resets in ${Math.ceil(rateCheck.resetMs / 1000)}s.`);
      err.code = 'RATE_LIMIT_EXCEEDED';
      throw err;
    }

    // 4. Sanitize PII
    const sanitizedPrompt = this.sanitizePII(prompt);
    const systemInstruction = this.buildSystemInstruction(context, language);

    // Format contents payload for Gemini REST API
    const contents = [];

    // Include recent history (sanitized, limit to last 4 turns)
    const recentHistory = (history || []).slice(-4);
    for (const msg of recentHistory) {
      if (msg.text) {
        contents.push({
          role: msg.sender === 'BOT' ? 'model' : 'user',
          parts: [{ text: this.sanitizePII(msg.text) }]
        });
      }
    }

    // Append current user turn
    contents.push({
      role: 'user',
      parts: [{ text: sanitizedPrompt }]
    });

    const activeModel = options.model || this.model;
    const activeTimeout = options.timeoutMs || this.timeoutMs;
    const url = `${this.baseUrl}/models/${activeModel}:generateContent?key=${activeKey}`;

    const payload = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents,
      generationConfig: {
        temperature: 0.3, // Grounded & deterministic
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 600
      }
    };

    // 5. Native fetch with AbortController timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), activeTimeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Provider error handling
      if (!response.ok) {
        let errorBody = {};
        try {
          errorBody = await response.json();
        } catch {
          // non-json response
        }

        const statusCode = response.status;
        const errorMsg = errorBody.error?.message || response.statusText || `HTTP ${statusCode}`;
        
        let err;
        if (statusCode === 429) {
          err = new Error(`PROVIDER_RATE_LIMIT_429: ${errorMsg}`);
          err.code = 'RATE_LIMIT_EXCEEDED';
        } else if (statusCode === 401 || statusCode === 403) {
          err = new Error(`INVALID_API_KEY: ${errorMsg}`);
          err.code = 'INVALID_API_KEY';
        } else {
          err = new Error(`PROVIDER_ERROR_${statusCode}: ${errorMsg}`);
          err.code = 'PROVIDER_ERROR';
        }

        this.circuitBreaker.recordFailure(err);
        throw err;
      }

      const data = await response.json();

      // Extract generated text
      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText || typeof candidateText !== 'string' || !candidateText.trim()) {
        const err = new Error('INVALID_RESPONSE: Gemini returned empty or malformed candidate text.');
        err.code = 'INVALID_RESPONSE';
        this.circuitBreaker.recordFailure(err);
        throw err;
      }

      // Record successful execution
      this.circuitBreaker.recordSuccess();

      return {
        text: candidateText.trim(),
        model: activeModel,
        usage: data.usageMetadata || {},
        language,
        engineUsed: 'AI_GEMINI'
      };

    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`TIMEOUT: Request to Gemini timed out after ${activeTimeout}ms.`);
        timeoutErr.code = 'TIMEOUT';
        this.circuitBreaker.recordFailure(timeoutErr);
        throw timeoutErr;
      }

      // If it's already an identified error with code, just throw
      if (err.code) {
        throw err;
      }

      // Network or connection failure
      const netErr = new Error(`NETWORK_ERROR: ${err.message || 'Failed to reach Gemini endpoint.'}`);
      netErr.code = 'NETWORK_ERROR';
      this.circuitBreaker.recordFailure(netErr);
      throw netErr;
    }
  }

  /**
   * Returns whether the gateway is ready to process requests
   * @returns {boolean}
   */
  isHealthy() {
    const hasKey = Boolean(this.apiKey || process.env.GEMINI_API_KEY);
    return hasKey && this.circuitBreaker.canExecute();
  }

  /**
   * Returns telemetry, circuit breaker state, and rate limit statistics
   * @returns {Object}
   */
  getStatus() {
    const hasKey = Boolean(this.apiKey || process.env.GEMINI_API_KEY);
    return {
      name: this.name,
      model: this.model,
      enabled: hasKey,
      hasApiKey: hasKey,
      isHealthy: this.isHealthy(),
      circuitBreaker: this.circuitBreaker.getState(),
      rateLimiter: this.rateLimiter.getStatus()
    };
  }

  /**
   * Resets internal state
   */
  reset() {
    this.circuitBreaker.reset();
    this.rateLimiter.reset();
  }
}

export default GeminiAIGateway;
