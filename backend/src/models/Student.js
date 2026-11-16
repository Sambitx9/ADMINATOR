import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: function() {
      return !this.isImportedRoster;
    },
    trim: true,
    default: null
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    default: null
  },
  isImportedRoster: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  importSource: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  email: {
    type: String,
    trim: true,
    default: null
  },
  guardianName: {
    type: String,
    trim: true,
    default: 'Parent / Guardian'
  },
  guardianPhone: {
    type: String,
    trim: true,
    default: null
  },
  district: {
    type: String,
    required: true,
    trim: true,
    default: 'Khordha'
  },
  state: {
    type: String,
    required: true,
    default: 'Odisha'
  },
  category: {
    type: String,
    required: true,
    enum: ['GENERAL', 'SC', 'ST', 'SEBC', 'OBC'],
    default: 'GENERAL'
  },
  qualification: {
    examType: {
      type: String,
      enum: ['10TH', '12TH_SCIENCE', '12TH_VOCATIONAL', 'ITI'],
      default: '10TH'
    },
    board: { type: String, default: 'BSE_ODISHA' },
    passingYear: { type: Number, default: () => new Date().getFullYear() },
    aggregatePercentage: { type: Number, default: 0 },
    subjects: {
      mathematics: { type: Boolean, default: true },
      science: { type: Boolean, default: true }
    },
    itiTrade: { type: String, default: null }
  },
  preferredLanguage: {
    type: String,
    enum: ['en', 'or', 'hi'],
    default: 'en'
  },
  isDemo: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true
});

StudentSchema.index({ mobileNumber: 1 });
StudentSchema.index({ district: 1 });
StudentSchema.index({ collegeId: 1 });
StudentSchema.index({ isImportedRoster: 1 });
StudentSchema.index({ fullName: 1 });

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);
