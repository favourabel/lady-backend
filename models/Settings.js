// ============================================
// User Settings Model
// ============================================
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    accountSettings: {
      email: String,
      phone: String,
      twoFactorAuth: {
        enabled: { type: Boolean, default: false },
        method: {
          type: String,
          enum: ['sms', 'email', 'authenticator'],
          default: 'email',
        },
      },
      sessionTimeout: {
        type: Number,
        default: 3600, // seconds
      },
    },
    cycleSettings: {
      cycleLength: {
        type: Number,
        default: 28,
        min: 15,
        max: 60,
      },
      periodDuration: {
        type: Number,
        default: 5,
        min: 2,
        max: 10,
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      startDayOfWeek: {
        type: String,
        enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        default: 'Sunday',
      },
    },
    reminderSettings: {
      periodReminder: {
        enabled: { type: Boolean, default: true },
        daysBeforePeriod: { type: Number, default: 1 },
        time: { type: String, default: '09:00' },
      },
      ovulationReminder: {
        enabled: { type: Boolean, default: true },
        time: { type: String, default: '09:00' },
      },
      waterIntakeReminder: {
        enabled: { type: Boolean, default: false },
        frequency: { type: Number, default: 3 },
        time: { type: String, default: '09:00' },
      },
      exerciseReminder: {
        enabled: { type: Boolean, default: false },
        frequency: { type: Number, default: 4 },
        time: { type: String, default: '10:00' },
      },
      sleepReminder: {
        enabled: { type: Boolean, default: false },
        time: { type: String, default: '22:00' },
      },
      medicationReminder: {
        enabled: { type: Boolean, default: false },
        time: { type: String, default: '09:00' },
      },
    },
    notificationSettings: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: false },
      smsNotifications: { type: Boolean, default: false },
      inAppNotifications: { type: Boolean, default: true },
      digestEmail: {
        enabled: { type: Boolean, default: true },
        frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
      },
    },
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ['private', 'friends', 'public'],
        default: 'private',
      },
      shareAnalytics: { type: Boolean, default: false },
      allowResearch: { type: Boolean, default: false },
      dataCollection: { type: Boolean, default: true },
    },
    displaySettings: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'light',
      },
      language: {
        type: String,
        enum: ['en', 'es', 'fr', 'de', 'pt', 'hi'],
        default: 'en',
      },
      dateFormat: {
        type: String,
        enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
        default: 'DD/MM/YYYY',
      },
      showWeekends: { type: Boolean, default: true },
      compactView: { type: Boolean, default: false },
    },
    dataSettings: {
      autoBackup: { type: Boolean, default: true },
      backupFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'weekly',
      },
    },
  },
  { timestamps: true }
);


const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;