import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    enum: ['USER', 'BOT', 'COUNSELLOR']
  },
  text: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['en', 'or', 'hi'],
    default: 'en'
  },
  intent: {
    type: String,
    default: 'GENERAL'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const ConversationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  enquiryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enquiry',
    default: null
  },
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    default: null
  },
  language: {
    type: String,
    enum: ['en', 'or', 'hi'],
    default: 'en'
  },
  engineUsed: {
    type: String,
    default: 'DETERMINISTIC'
  },
  messages: [MessageSchema],
  handoffRequested: {
    type: Boolean,
    default: false
  },
  handoffStatus: {
    type: String,
    enum: ['NONE', 'PENDING', 'CONNECTED', 'RESOLVED'],
    default: 'NONE'
  }
}, {
  timestamps: true
});

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
