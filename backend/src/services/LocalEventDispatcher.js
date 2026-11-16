/**
 * ADMINATOR — Local Event Dispatcher & Dual-Mode Automation Bus
 * 
 * Default Mode: In-Process Node.js EventEmitter (₹0 Forever, Zero-Cost Core)
 * Auxiliary Mode: n8n Webhook Dispatcher (Self-hosted Community Edition or n8n Cloud)
 * 
 * Invariants:
 *   - Core Express transactions NEVER fail or wait if n8n is offline, timing out, or dead.
 *   - Strict PII minimization: candidate phone numbers and sensitive data are masked.
 *   - Multi-tenant isolation: every event explicitly identifies collegeCode (default: DRIEMS).
 *   - Cryptographic HMAC-SHA256 signatures with timestamp anti-replay defense.
 *   - Automatic exponential backoff retries and Dead-Letter Queue (DLQ) capture.
 */

import { EventEmitter } from 'node:events';
import crypto from 'node:crypto';
import AutomationLog from '../models/AutomationLog.js';

export class LocalEventDispatcher extends EventEmitter {
  /**
   * @param {Object} [options]
   */
  constructor(options = {}) {
    super();
    this.name = 'LocalEventDispatcher';
    this.automationEngine = options.automationEngine || process.env.AUTOMATION_ENGINE || 'local';
    this.webhookUrl = options.webhookUrl || process.env.N8N_WEBHOOK_URL || null;
    this.webhookSecret = options.webhookSecret || process.env.N8N_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || 'adminator_webhook_secret_key_2026';
    this.timeoutMs = options.timeoutMs || parseInt(process.env.N8N_TIMEOUT_MS, 10) || 5000;
    this.maxRetries = options.maxRetries || parseInt(process.env.N8N_MAX_RETRIES, 10) || 3;

    this.metrics = {
      dispatched: 0,
      delivered: 0,
      retried: 0,
      failed: 0,
      dlq: 0
    };

    // In-memory idempotency cache (stores eventIds up to 2000 entries)
    this.processedEvents = new Set();
    this.inAppNotifications = [];

    this._registerDefaultListeners();
  }

  /**
   * Masks student PII to enforce strict privacy compliance before external dispatch
   * Invariant: Never send unmasked personal student phone numbers or raw identifiers to webhooks
   * @param {Object} payload
   * @returns {Object}
   */
  maskPII(payload = {}) {
    if (!payload || typeof payload !== 'object') return {};
    const sanitized = { ...payload };

    // Mask phone number: e.g. "9876543210" -> "98****3210"
    if (sanitized.mobileNumber) {
      sanitized.mobileNumber = String(sanitized.mobileNumber).replace(/^(\d{2})\d{4}(\d{4})$/, '$1****$2');
    }
    if (sanitized.phone) {
      sanitized.phone = String(sanitized.phone).replace(/^(\d{2})\d{4}(\d{4})$/, '$1****$2');
    }
    if (sanitized.studentPhone) {
      sanitized.studentPhone = String(sanitized.studentPhone).replace(/^(\d{2})\d{4}(\d{4})$/, '$1****$2');
    }

    // Mask email address if present
    if (sanitized.email) {
      sanitized.email = String(sanitized.email).replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}${'*'.repeat(Math.max(1, b.length))}${c}`);
    }

    // Ensure tenant collegeCode is always explicit
    if (!sanitized.collegeCode) {
      sanitized.collegeCode = 'DRIEMS';
    }

    return sanitized;
  }

  /**
   * Generates HMAC-SHA256 cryptographic signature for webhook payload
   * @param {string} payloadString
   * @param {string} secret
   * @param {number|string} timestamp
   * @returns {string}
   */
  generateSignature(payloadString, secret, timestamp) {
    const key = secret || this.webhookSecret;
    return crypto
      .createHmac('sha256', key)
      .update(`${timestamp}.${payloadString}`)
      .digest('hex');
  }

  /**
   * Verifies an incoming HMAC-SHA256 signature
   * Includes anti-replay protection (tolerance: 5 minutes)
   * @param {string} signatureHeader
   * @param {string} payloadString
   * @param {string} secret
   * @param {number|string} timestamp
   * @returns {{ valid: boolean, reason?: string }}
   */
  verifySignature(signatureHeader, payloadString, secret, timestamp) {
    if (!signatureHeader || !timestamp) {
      return { valid: false, reason: 'MISSING_SIGNATURE_OR_TIMESTAMP' };
    }

    // Anti-replay check (5 minute drift window)
    const now = Date.now();
    const tsNum = Number(timestamp);
    if (isNaN(tsNum) || Math.abs(now - tsNum) > 300000) {
      return { valid: false, reason: 'TIMESTAMP_EXPIRED_OR_DRIFT_EXCEEDED' };
    }

    const expectedSig = this.generateSignature(payloadString, secret || this.webhookSecret, timestamp);
    const providedSig = signatureHeader.replace(/^sha256=/, '').trim();

    try {
      const bufExpected = Buffer.from(expectedSig, 'hex');
      const bufProvided = Buffer.from(providedSig, 'hex');

      if (bufExpected.length !== bufProvided.length) {
        return { valid: false, reason: 'SIGNATURE_LENGTH_MISMATCH' };
      }

      const match = crypto.timingSafeEqual(bufExpected, bufProvided);
      return { valid: match, reason: match ? null : 'INVALID_SIGNATURE' };
    } catch {
      return { valid: false, reason: 'SIGNATURE_VERIFICATION_ERROR' };
    }
  }

  /**
   * Registers default in-process listeners for ₹0 offline local operation
   * @private
   */
  _registerDefaultListeners() {
    // 1. Lead Notification Alert
    this.on('ENQUIRY_CREATED', async (payload) => {
      this.inAppNotifications.unshift({
        id: 'notif_' + Date.now(),
        type: 'ENQUIRY_CREATED',
        trackingId: payload.trackingId,
        collegeCode: payload.collegeCode || 'DRIEMS',
        studentName: payload.studentName || 'New Candidate',
        message: `New Admission Enquiry registered: ${payload.trackingId} for ${payload.collegeCode || 'DRIEMS'}`,
        timestamp: new Date(),
        read: false
      });
      if (this.inAppNotifications.length > 100) this.inAppNotifications.pop();
    });

    // 2. Human Handoff Escalation
    this.on('HANDOFF_REQUESTED', async (payload) => {
      this.inAppNotifications.unshift({
        id: 'notif_handoff_' + Date.now(),
        type: 'HANDOFF_REQUESTED',
        sessionId: payload.sessionId,
        collegeCode: payload.collegeCode || 'DRIEMS',
        urgency: payload.urgency || 'HIGH',
        message: `URGENT: Human Counsellor requested in session ${payload.sessionId}`,
        timestamp: new Date(),
        read: false
      });
    });

    // 3. Status Changed
    this.on('STATUS_CHANGED', async (payload) => {
      // In-memory telemetry
    });

    // 4. Lead Assigned
    this.on('LEAD_ASSIGNED', async (payload) => {
      this.inAppNotifications.unshift({
        id: 'notif_assign_' + Date.now(),
        type: 'LEAD_ASSIGNED',
        trackingId: payload.trackingId,
        counsellorName: payload.counsellorName,
        collegeCode: payload.collegeCode || 'DRIEMS',
        message: `Lead ${payload.trackingId} assigned to ${payload.counsellorName}`,
        timestamp: new Date(),
        read: false
      });
    });
  }

  /**
   * Dispatches an event through the local event bus and optionally forwards to n8n webhook
   * @param {string} eventName
   * @param {Object} rawPayload
   * @param {Object} [options]
   * @returns {{ eventId: string, event: string, dispatched: boolean, mode: string }}
   */
  dispatch(eventName, rawPayload = {}, options = {}) {
    const eventId = options.eventId || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Idempotency: Reject duplicate event IDs
    if (this.processedEvents.has(eventId)) {
      return { eventId, event: eventName, dispatched: false, duplicate: true };
    }
    this.processedEvents.add(eventId);
    if (this.processedEvents.size > 2000) {
      const first = this.processedEvents.values().next().value;
      this.processedEvents.delete(first);
    }

    // Mask PII and enforce tenant isolation
    const sanitizedPayload = this.maskPII(rawPayload);
    const enrichedPayload = {
      eventId,
      event: eventName,
      timestamp: new Date().toISOString(),
      collegeCode: sanitizedPayload.collegeCode || 'DRIEMS',
      data: sanitizedPayload
    };

    this.metrics.dispatched += 1;

    // 1. Immediate In-Process Emission (Zero latency, ₹0 forever)
    try {
      this.emit(eventName, enrichedPayload);
    } catch (err) {
      console.error(`[LocalEventDispatcher] Error in local listener for ${eventName}:`, err);
    }

    // 2. Auxiliary n8n Webhook Dispatch (Non-blocking, silent fail-safe)
    const shouldDispatchWebhook = options.forceWebhook || this.automationEngine === 'n8n' || Boolean(this.webhookUrl);
    if (shouldDispatchWebhook && this.webhookUrl) {
      this._dispatchWebhookAsync(eventName, enrichedPayload, eventId, options).catch((err) => {
        // Non-blocking catch-all
        console.warn(`[LocalEventDispatcher] Background webhook failure for ${eventId}:`, err.message);
      });
    }

    return {
      eventId,
      event: eventName,
      dispatched: true,
      mode: this.automationEngine
    };
  }

  /**
   * Asynchronously posts webhook to n8n with retries, timeout, and DLQ capture
   * @private
   */
  async _dispatchWebhookAsync(eventName, payload, eventId, options = {}) {
    const targetUrl = options.webhookUrl || this.webhookUrl;
    if (!targetUrl) return;

    const payloadString = JSON.stringify(payload);
    const timestamp = Date.now();
    const signature = this.generateSignature(payloadString, this.webhookSecret, timestamp);

    const headers = {
      'Content-Type': 'application/json',
      'X-Adminator-Signature': `sha256=${signature}`,
      'X-Adminator-Timestamp': String(timestamp),
      'X-Adminator-Event-Id': eventId,
      'X-Adminator-Event': eventName,
      'X-Adminator-Tenant': payload.collegeCode || 'DRIEMS',
      'User-Agent': 'ADMINATOR-EventBus/1.0'
    };

    const maxAttempts = options.maxRetries || this.maxRetries;
    const timeoutMs = options.timeoutMs || this.timeoutMs;
    let attempt = 0;
    let lastError = null;

    while (attempt < maxAttempts) {
      attempt += 1;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: payloadString,
          signal: controller.signal
        });

        clearTimeout(timer);

        if (response.ok) {
          this.metrics.delivered += 1;
          
          // Asynchronously log success in MongoDB (non-blocking)
          AutomationLog.create({
            eventId,
            event: eventName,
            collegeCode: payload.collegeCode || 'DRIEMS',
            status: 'DELIVERED',
            attempts: attempt,
            targetUrl,
            payload,
            deliveredAt: new Date()
          }).catch(() => {});

          return { success: true, attempts: attempt, status: response.status };
        }

        // Non-2xx response
        lastError = new Error(`Webhook target responded with HTTP ${response.status}`);
        this.metrics.retried += 1;
      } catch (err) {
        clearTimeout(timer);
        lastError = err.name === 'AbortError'
          ? new Error(`Webhook request timed out after ${timeoutMs}ms`)
          : new Error(`Network failure: ${err.message}`);
        this.metrics.retried += 1;
      }

      // Backoff before retry if attempts remain
      if (attempt < maxAttempts) {
        const backoffMs = Math.min(100 * Math.pow(2, attempt - 1), 2000);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }

    // All retries exhausted -> Capture in Dead-Letter Queue (DLQ)
    this.metrics.failed += 1;
    this.metrics.dlq += 1;

    try {
      await AutomationLog.create({
        eventId,
        event: eventName,
        collegeCode: payload.collegeCode || 'DRIEMS',
        status: 'DEAD_LETTER',
        attempts: attempt,
        targetUrl,
        payload,
        lastError: lastError ? lastError.message : 'Exhausted retry attempts',
        deadLetterAt: new Date()
      });
    } catch {
      // non-blocking
    }

    return { success: false, deadLetter: true, error: lastError?.message };
  }

  /**
   * Returns live telemetry, mode, and notification queue status
   * @returns {Object}
   */
  getStatus() {
    return {
      name: this.name,
      automationEngine: this.automationEngine,
      webhookConfigured: Boolean(this.webhookUrl),
      targetUrl: this.webhookUrl ? this.webhookUrl.replace(/\/\/[^@]*@/, '//***@') : null,
      timeoutMs: this.timeoutMs,
      maxRetries: this.maxRetries,
      metrics: { ...this.metrics },
      inAppNotificationsCount: this.inAppNotifications.length,
      processedEventsCount: this.processedEvents.size
    };
  }

  /**
   * Resets metrics and in-memory caches (for testing)
   */
  reset() {
    this.processedEvents.clear();
    this.inAppNotifications = [];
    this.metrics = {
      dispatched: 0,
      delivered: 0,
      retried: 0,
      failed: 0,
      dlq: 0
    };
  }

  /**
   * Dynamically configures the event dispatcher
   * @param {Object} cfg
   */
  configure(cfg = {}) {
    if (cfg.automationEngine) this.automationEngine = cfg.automationEngine;
    if (cfg.webhookUrl !== undefined) this.webhookUrl = cfg.webhookUrl;
    if (cfg.webhookSecret) this.webhookSecret = cfg.webhookSecret;
    if (cfg.timeoutMs) this.timeoutMs = cfg.timeoutMs;
    if (cfg.maxRetries) this.maxRetries = cfg.maxRetries;
  }
}

export const localEventBus = new LocalEventDispatcher();
export default localEventBus;
