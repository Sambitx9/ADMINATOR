import mongoose from 'mongoose';

const EligibilityRuleSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  branchCode: {
    type: String,
    required: true,
    uppercase: true
  },
  pathway: {
    type: String,
    required: true,
    enum: ['FIRST_YEAR', 'LATERAL_ENTRY']
  },
  minPercentageGeneral: {
    type: Number,
    required: true,
    default: 35.0
  },
  minPercentageReserved: {
    type: Number,
    required: true,
    default: 30.0
  },
  mandatorySubjects: {
    type: [String],
    default: ['MATHEMATICS', 'SCIENCE']
  },
  eligibleItiTrades: {
    type: [String],
    default: []
  },
  minAgeYears: {
    type: Number,
    required: true,
    default: 14
  },
  maxAgeYears: {
    type: Number,
    default: null
  },
  ruleVersion: {
    type: String,
    required: true,
    default: '2025.1'
  },
  isDemo: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true
});

EligibilityRuleSchema.index({ collegeId: 1, courseId: 1, pathway: 1 }, { unique: true });

export default mongoose.models.EligibilityRule || mongoose.model('EligibilityRule', EligibilityRuleSchema);
