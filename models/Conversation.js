const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, 
    },
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    // Updated: Added 'ai' to enum
    lastMessageSender: {
      type: String,
      enum: ['user', 'admin', 'ai'],
      default: null,
    },
    unreadByUser: {
      type: Number,
      default: 0,
    },
    unreadByAdmin: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes
conversationSchema.index({ isActive: 1, lastMessageAt: -1 });
conversationSchema.index({ unreadByAdmin: -1 });

conversationSchema.methods.markReadByUser = function () {
  this.unreadByUser = 0;
  return this.save();
};

conversationSchema.methods.markReadByAdmin = function () {
  this.unreadByAdmin = 0;
  return this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;