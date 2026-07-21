const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    // Updated: Added 'ai' to enum
    senderType: {
      type: String,
      enum: ['user', 'admin', 'ai'], 
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
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
    reactions: [String], 
  },
  { timestamps: true }
);

// Indexes
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ userId: 1, createdAt: -1 });
messageSchema.index({ isRead: 1, senderType: 1 });

messageSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

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