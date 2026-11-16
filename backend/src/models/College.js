import mongoose from 'mongoose';

const CollegeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    default: 'Odisha'
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    pinCode: { type: String, required: true }
  },
  contactEmail: {
    type: String,
    required: true,
    trim: true
  },
  contactPhone: {
    type: String,
    required: true,
    trim: true
  },
  isDemo: {
    type: Boolean,
    required: true,
    default: true
  },
  isDefault: {
    type: Boolean,
    required: true,
    default: false
  },
  demoNotice: {
    type: String,
    required: true,
    default: '[DEMO DATA - FOR EVALUATION ONLY - NOT OFFICIAL ADMISSION DATA]'
  },
  facilities: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

CollegeSchema.index({ district: 1, isActive: 1 });
CollegeSchema.index({ isDefault: -1, createdAt: 1 });
CollegeSchema.index({ isDemo: 1 });

export default mongoose.models.College || mongoose.model('College', CollegeSchema);
