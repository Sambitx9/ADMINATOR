/**
 * ADMINATOR — Automation & Webhook Delivery Log Model
 * 
 * Tracks webhook delivery attempts, retries, idempotency keys,
 * and Dead-Letter Queue (DLQ) records for n8n and local event dispatches.
 */

import mongoose from 'mongoose';

const AutomationLogSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    event: {
      type: String,
      required: true,
      enum: [
        'ENQUIRY_CREATED',
        'HANDOFF_REQUESTED',
        'STATUS_CHANGED',
        'LEAD_ASSIGNED',
        'DIGEST_REQUESTED',
        'CLASSIFY_INTENT'
      ],
      index: true
    },
    collegeCode: {
      type: String,
      default: 'DRIEMS',
      index: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'DELIVERED', 'FAILED', 'DEAD_LETTER'],
      default: 'PENDING',
      index: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    targetUrl: {
      type: String,
      default: null
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    lastError: {
      type: String,
      default: null
    },
    deliveredAt: {
      type: Date,
      default: null
    },
    deadLetterAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.AutomationLog || mongoose.model('AutomationLog', AutomationLogSchema);
