import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    actorName: {
      type: String,
      required: true
    },
    actorRole: {
      type: String,
      required: true,
      enum: ['COUNSELLOR', 'COLLEGE_ADMIN', 'PLATFORM_ADMIN', 'SYSTEM']
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      default: null,
      index: true
    },
    entityType: {
      type: String,
      required: true,
      enum: ['ENQUIRY', 'USER', 'NOTE', 'SYSTEM']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: ['LEAD_CREATED', 'LEAD_ASSIGNED', 'STATUS_CHANGED', 'NOTE_ADDED']
    },
    previousValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    metadata: {
      ipAddress: { type: String, default: null },
      userAgent: { type: String, default: null },
      reason: { type: String, default: null }
    },
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true
    }
  },
  {
    timestamps: false
  }
);

// Indexes
auditLogSchema.index({ collegeId: 1, timestamp: -1 });
auditLogSchema.index({ entityId: 1, timestamp: -1 });
auditLogSchema.index({ actorId: 1, timestamp: -1 });
auditLogSchema.index({ collegeId: 1, action: 1 });

// Application-level append-only enforcement (block update / delete mutations)
auditLogSchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne'],
  function () {
    throw new Error('AUDIT_IMMUTABILITY_VIOLATION: Audit log records cannot be updated.');
  }
);

auditLogSchema.pre(
  ['deleteOne', 'deleteMany', 'findOneAndDelete', 'findOneAndRemove'],
  function () {
    throw new Error('AUDIT_IMMUTABILITY_VIOLATION: Audit log records cannot be deleted.');
  }
);

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
