// ============================================
// Reminder Model (cycle & activity reminders)
// ============================================
const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'period',
        'ovulation',
        'fertile-window',
        'water-intake',
        'medication',
        'exercise',
        'sleep',
        'custom',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    dueDate: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      default: '09:00', // HH:mm format
    },
    recurrence: {
      type: String,
      enum: ['once', 'daily', 'weekly', 'monthly', 'none'],
      default: 'none',
    },
    recurrenceEndDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    notificationSentAt: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Indexes
reminderSchema.index({ userId: 1, dueDate: 1 });
reminderSchema.index({ userId: 1, isActive: 1 });
reminderSchema.index({ notificationSent: 1, dueDate: 1 });

const Reminder = mongoose.model('Reminder', reminderSchema);
module.exports = Reminder;