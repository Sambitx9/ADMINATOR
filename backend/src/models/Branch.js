import mongoose from 'mongoose';

const BranchSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    en: { type: String, required: true },
    or: { type: String, required: true },
    hi: { type: String, required: true }
  },
  description: {
    en: { type: String, required: true },
    or: { type: String, required: true },
    hi: { type: String, required: true }
  },
  careerProspects: {
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

export default mongoose.models.Branch || mongoose.model('Branch', BranchSchema);
