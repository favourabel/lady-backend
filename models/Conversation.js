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
    // ✅ NEW: Track AI activity in this conversation
    handledByAI: {
      type: Boolean,
      default: false,
    },
    // ✅ NEW: Count how many times AI has responded
    aiMessageCount: {
      type: Number,
      default: 0,
    },
    // ✅ NEW: Last time AI responded
    lastAIResponseAt: {
      type: Date,
      default: null,
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
conversationSchema.index({ handledByAI: 1 }); // ✅ NEW: For AI queries

// ✅ EXISTING: Mark as read methods (unchanged)
conversationSchema.methods.markReadByUser = function () {
  this.unreadByUser = 0;
  return this.save();
};

conversationSchema.methods.markReadByAdmin = function () {
  this.unreadByAdmin = 0;
  return this.save();
};

// ✅ NEW: Helper method to increment AI count
conversationSchema.methods.incrementAICount = function () {
  this.aiMessageCount = (this.aiMessageCount || 0) + 1;
  this.handledByAI = true;
  this.lastAIResponseAt = new Date();
  return this.save();
};

// ✅ NEW: Helper method to check if conversation needs admin attention
conversationSchema.methods.needsAdminAttention = function () {
  return this.handledByAI && this.unreadByAdmin > 0;
};

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;