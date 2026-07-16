// ============================================
// Message Model (single chat message)
// ============================================
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    // Who sent this message: 'user' or 'admin'
    senderType: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
    },
    // Actual sender ID (either User or Admin)
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Ref determined by senderType (User or Admin)
    },
    // The user this conversation belongs to (for easy querying)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    attachments: [
      {
        filename: String,
        url: String,
        type: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    editHistory: [
      {
        content: String,
        editedAt: Date,
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    reactions: [String], // emoji reactions
  },
  { timestamps: true }
);

// Indexes
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ userId: 1, createdAt: -1 });
messageSchema.index({ isRead: 1, senderType: 1 });

// Mark as read
messageSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Edit message
messageSchema.methods.editMessage = function (newContent) {
  this.editHistory.push({
    content: this.content,
    editedAt: new Date(),
  });
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;