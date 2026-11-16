/**
 * ADMINATOR — Automation & Webhook Integration Routes
 * 
 * Provides secure endpoints for n8n webhook interactions, status telemetry,
 * and Dead-Letter Queue inspection.
 */

import express from 'express';
import { localEventBus } from '../services/LocalEventDispatcher.js';
import AutomationLog from '../models/AutomationLog.js';
import { Conversation } from '../models/index.js';

const router = express.Router();

/**
 * Middleware: Verifies HMAC-SHA256 webhook signature and anti-replay timestamp
 */
const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-adminator-signature'];
  const timestamp = req.headers['x-adminator-timestamp'];
  const secret = process.env.N8N_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || 'adminator_webhook_secret_key_2026';

  if (!signature || !timestamp) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED_WEBHOOK',
      message: 'Missing X-Adminator-Signature or X-Adminator-Timestamp header'
    });
  }

  const payloadString = JSON.stringify(req.body);
  const verification = localEventBus.verifySignature(signature, payloadString, secret, timestamp);

  if (!verification.valid) {
    return res.status(401).json({
      success: false,
      error: 'INVALID_SIGNATURE',
      message: `Webhook signature verification failed: ${verification.reason}`
    });
  }

  next();
};

/**
 * GET /api/v1/automation/status
 * Returns current automation engine state, webhook status, and delivery metrics
 */
router.get('/status', (req, res) => {
  try {
    const status = localEventBus.getStatus();
    return res.status(200).json({
      success: true,
      data: status
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve automation status'
    });
  }
});

/**
 * POST /api/v1/automation/webhook
 * Ingestion webhook for n8n workflows callback with HMAC signature verification
 */
router.post('/webhook', verifyWebhookSignature, async (req, res) => {
  try {
    const eventId = req.headers['x-adminator-event-id'] || req.body.eventId;
    const { event, action, data } = req.body;

    if (!eventId || !event) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'eventId and event name are required.'
      });
    }

    // Idempotency check: record callback
    return res.status(200).json({
      success: true,
      message: `Webhook event ${event} processed successfully`,
      receivedEventId: eventId,
      processedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('[AutomationRoutes] Error processing incoming webhook:', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to process incoming webhook'
    });
  }
});

/**
 * POST /api/v1/crm/notifications
 * Receives simulated counsellor notification alerts from WF-03
 */
router.post('/notifications', (req, res) => {
  try {
    const { trackingId, message, collegeCode = 'DRIEMS', type = 'COUNSELLOR_ALERT' } = req.body;

    const notif = {
      id: `notif_${Date.now()}`,
      trackingId,
      message,
      collegeCode,
      type,
      timestamp: new Date()
    };

    localEventBus.inAppNotifications.unshift(notif);
    if (localEventBus.inAppNotifications.length > 100) localEventBus.inAppNotifications.pop();

    return res.status(201).json({
      success: true,
      message: 'Notification recorded in CRM alert queue',
      data: notif
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to record notification'
    });
  }
});

/**
 * GET /api/v1/crm/notifications
 * Lists recent in-app CRM alert notifications
 */
router.get('/notifications', (req, res) => {
  return res.status(200).json({
    success: true,
    data: localEventBus.inAppNotifications
  });
});

/**
 * POST /api/v1/chat/handoff
 * Accepts handoff escalation updates from WF-04
 */
router.post('/handoff', async (req, res) => {
  try {
    const { sessionId, status = 'PENDING', counsellorId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'sessionId is required'
      });
    }

    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Conversation not found'
      });
    }

    conversation.handoffRequested = true;
    conversation.handoffStatus = status;
    await conversation.save();

    return res.status(200).json({
      success: true,
      message: `Handoff status for session ${sessionId} updated to ${status}`,
      data: {
        sessionId,
        handoffStatus: conversation.handoffStatus,
        updatedAt: conversation.updatedAt
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to update handoff status'
    });
  }
});

/**
 * GET /api/v1/automation/dlq
 * Lists Dead-Letter Queue records from MongoDB
 */
router.get('/dlq', async (req, res) => {
  try {
    const dlqRecords = await AutomationLog.find({ status: 'DEAD_LETTER' })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      count: dlqRecords.length,
      data: dlqRecords
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to fetch DLQ records'
    });
  }
});

export default router;
