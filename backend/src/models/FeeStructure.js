import mongoose from 'mongoose';

const FeeStructureSchema = new mongoose.Schema({
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
  academicYear: {
    type: String,
    required: true,
    default: '2025-26'
  },
  tuitionFeePerSemester: {
    type: Number,
    required: true
  },
  admissionFeeOneTime: {
    type: Number,
    required: true,
    default: 3000
  },
  labWorkshopFeePerYear: {
    type: Number,
    required: true,
    default: 4000
  },
  hostelFeePerSemester: {
    type: Number,
    default: 0
  },
  scholarshipsAvailable: [{
    name: { type: String, required: true },
    waiverAmount: { type: String, required: true },
    criteria: { type: String, required: true }
  }],
  sampleFeeDisclaimer: {
    type: String,
    required: true,
    default: '[SAMPLE FEE STRUCTURE - FOR DEMO ONLY - NOT AN OFFICIAL INVOICE]'
  },
  isDemo: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true
});

FeeStructureSchema.index({ collegeId: 1, courseId: 1, academicYear: 1 }, { unique: true });

export default mongoose.models.FeeStructure || mongoose.model('FeeStructure', FeeStructureSchema);
