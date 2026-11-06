const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true
  },
  sender: {
    name: String,
    email: String,
    ip: String
  },
  content: {
    type: String,
    required: true
  },
  type: {
  type: String,
  enum: ['text', 'file', 'image', 'video', 'audio', 'other', 'visitor', 'admin'],
  default: 'text'
},
  fileUrl: String,
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  replied: {
    type: Boolean,
    default: false
  },
  repliedAt: Date,
  replyContent: String,
  source: {
    type: String,
    enum: ['website', 'whatsapp', 'email', 'instagram', 'twitter', 'linkedin', 'other'],
    default: 'website'
  },
  delivered: {
  type: Boolean,
  default: false
},
  metadata: {
    userAgent: String,
    platform: String,
    location: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);