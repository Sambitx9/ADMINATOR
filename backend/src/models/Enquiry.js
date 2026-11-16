import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema(
  {
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    authorName: {
      type: String,
      required: true
    },
    authorRole: {
      type: String,
      required: true,
      enum: ['COUNSELLOR', 'COLLEGE_ADMIN', 'PLATFORM_ADMIN', 'SYSTEM']
    },
    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 2000
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true
    }
  },
  { _id: false }
);

const StatusHistorySchema = new mongoose.Schema(
  {
    fromStatus: {
      type: String,
      default: null
    },
    toStatus: {
      type: String,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    changedByName: {
      type: String,
      default: 'SYSTEM'
    },
    changedByRole: {
      type: String,
      default: 'SYSTEM'
    },
    reason: {
      type: String,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now,
      immutable: true
    }
  },
  { _id: false }
);

const EnquirySchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
      index: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null
    },
    pathway: {
      type: String,
      enum: ['FIRST_YEAR', 'LATERAL_ENTRY'],
      default: 'FIRST_YEAR'
    },
    eligibilityStatus: {
      type: String,
      enum: ['ELIGIBLE', 'NOT_ELIGIBLE', 'NEEDS_MANUAL_VERIFICATION', 'CONDITIONAL_REVIEW'],
      default: 'NEEDS_MANUAL_VERIFICATION'
    },
    eligibilityBreakdown: [
      {
        rule: { type: String, required: true },
        passed: { type: Boolean, required: true },
        detail: { type: String, required: true }
      }
    ],
    status: {
      type: String,
      required: true,
      enum: [
        'NEW',
        'ASSIGNED',
        'CONTACTED',
        'VERIFIED',
        'ENROLLED',
        'REJECTED',
        'IN_REVIEW',
        'DOCUMENT_VERIFIED',
        'OFFERED'
      ],
      default: 'NEW',
      index: true
    },
    priority: {
      type: String,
      enum: ['HOT', 'WARM', 'COLD'],
      default: 'WARM'
    },
    assignedCounsellorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    consent: {
      granted: { type: Boolean, default: true },
      timestamp: { type: Date, default: Date.now },
      ipAddress: { type: String, default: '127.0.0.1' },
      version: { type: String, default: '1.0' }
    },
    // Public notes/remarks from student portal
    notes: [
      {
        author: { type: String, default: 'SYSTEM' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    // Confidential internal counsellor notes (strictly CRM-authenticated, never exposed to student)
    internalNotes: [NoteSchema],
    // Immutable lifecycle transition history
    statusHistory: [StatusHistorySchema],
    rejectionReason: {
      type: String,
      default: null
    },
    isDemo: {
      type: Boolean,
      required: true,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
EnquirySchema.index({ collegeId: 1, status: 1 });
EnquirySchema.index({ collegeId: 1, priority: 1 });
EnquirySchema.index({ collegeId: 1, createdAt: -1 });
EnquirySchema.index({ collegeId: 1, updatedAt: -1 });
EnquirySchema.index({ studentId: 1, collegeId: 1 });
EnquirySchema.index({ assignedCounsellorId: 1, status: 1 });
EnquirySchema.index({ createdAt: -1 });
EnquirySchema.index({ updatedAt: -1 });

export default mongoose.models.Enquiry || mongoose.model('Enquiry', EnquirySchema);
export { EnquirySchema };
