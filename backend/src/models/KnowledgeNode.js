import mongoose from 'mongoose';

const KnowledgeNodeSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    default: null,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['HOSTEL', 'SCHOLARSHIP', 'ADMISSION_DATES', 'LATERAL_ENTRY', 'FIRST_YEAR', 'FEES', 'DOCUMENTS', 'CAMPUS'],
    index: true
  },
  question: {
    en: { type: String, required: true },
    or: { type: String, required: true },
    hi: { type: String, required: true }
  },
  answer: {
    en: { type: String, required: true },
    or: { type: String, required: true },
    hi: { type: String, required: true }
  },
  tags: {
    type: [String],
    default: []
  },
  isDemo: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.models.KnowledgeNode || mongoose.model('KnowledgeNode', KnowledgeNodeSchema);
