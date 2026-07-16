// ============================================
// Notification Model
// ============================================
const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../config/Constants');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
      default: 'general',
    },
    title: {
      type: String,
      default: 'Notification',
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    channel: {
      type: String,
      enum: ['in-app', 'email', 'push', 'sms'],
      default: 'in-app',
    },
    actionUrl: {
      type: String,
      default: null,
    },
    actionLabel: {
      type: String,
      default: null,
    },
    // Track sender (admin who sent it)
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    // Broadcast to all users?
    isBroadcast: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ type: 1 });

// Mark as read
notificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;