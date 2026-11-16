import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
    index: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  branchCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  pathway: {
    type: String,
    required: true,
    enum: ['FIRST_YEAR', 'LATERAL_ENTRY']
  },
  durationYears: {
    type: Number,
    required: true,
    default: 3
  },
  totalSeats: {
    type: Number,
    required: true,
    default: 60
  },
  availableSeats: {
    type: Number,
    required: true,
    default: 60
  },
  isDemo: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true
});

CourseSchema.index({ collegeId: 1, branchCode: 1, pathway: 1 }, { unique: true });
CourseSchema.index({ collegeId: 1, isDemo: 1 });

export default mongoose.models.Course || mongoose.model('Course', CourseSchema);
