// ============================================
// Conversation Model (User ↔ Admin chat)
// ============================================
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    // The USER in this conversation (admin talks to many users)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one conversation per user
    },
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    lastMessageSender: {
      type: String,
      enum: ['user', 'admin'],
      default: null,
    },
    // Unread count for user side and admin side
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

// Mark all messages as read for user
conversationSchema.methods.markReadByUser = function () {
  this.unreadByUser = 0;
  return this.save();
};

// Mark all messages as read for admin
conversationSchema.methods.markReadByAdmin = function () {
  this.unreadByAdmin = 0;
  return this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;