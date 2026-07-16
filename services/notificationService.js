// ============================================
// services/notificationService.js
// Notification creation & real-time sending
// ============================================
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

// Socket.io reference (set during socket initialization)
let io = null;

const setSocketIO = (socketIO) => {
  io = socketIO;
};

// ============================================
// Get default icon for notification type
// ============================================
const getDefaultIcon = (type) => {
  const icons = {
    period: '🌸',
    fertility: '🥚',
    health: '💡',
    hygiene: '🧼',
    reminder: '🔔',
    general: '📢',
  };
  return icons[type] || '🔔';
};

// ============================================
// Create & send notification
// ============================================
const createNotification = async ({
  userId,
  title,
  message,
  type = 'general',
  actionUrl,
  actionLabel,
  sentBy,
  data,
}) => {
  try {
    const notification = await Notification.create({
      userId,
      title: title || getDefaultTitle(type),
      message,
      type,
      actionUrl,
      actionLabel,
      sentBy,
      data: data || {},
    });

    // Send real-time via Socket.io if user online
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', {
        notification: notification.toObject(),
      });

      // Send updated unread count
      const unreadCount = await Notification.countDocuments({
        userId,
        isRead: false,
      });
      io.to(`user:${userId}`).emit('notification:count', { count: unreadCount });
    }

    logger.info(`Notification created for user ${userId}: ${title || type}`);
    return notification;
  } catch (error) {
    logger.error(`Failed to create notification: ${error.message}`);
    throw error;
  }
};

// ============================================
// Broadcast notification to multiple users
// ============================================
const broadcastNotification = async ({
  userIds,
  title,
  message,
  type = 'general',
  sentBy,
}) => {
  try {
    const notifications = userIds.map((userId) => ({
      userId,
      title: title || getDefaultTitle(type),
      message,
      type,
      sentBy,
      isBroadcast: true,
    }));

    const created = await Notification.insertMany(notifications);

    // Real-time send to online users
    if (io) {
      userIds.forEach((userId) => {
        const match = created.find(
          (n) => n.userId.toString() === userId.toString()
        );
        if (match) {
          io.to(`user:${userId}`).emit('notification:new', {
            notification: match.toObject(),
          });
        }
      });
    }

    logger.info(`Broadcast notification sent to ${userIds.length} users`);
    return created;
  } catch (error) {
    logger.error(`Broadcast failed: ${error.message}`);
    throw error;
  }
};

// ============================================
// Type-specific helpers
// ============================================
const sendPeriodReminderNotification = async (user, daysUntil) => {
  const title =
    daysUntil === 0
      ? '🌸 Your Period Starts Today!'
      : daysUntil === 1
      ? '🌸 Your Period Starts Tomorrow!'
      : `🌸 Period in ${daysUntil} Days`;

  const message =
    daysUntil === 0
      ? 'Your period is expected to start today. Take care of yourself!'
      : `Your period is predicted in ${daysUntil} day(s). Plan ahead!`;

  return createNotification({
    userId: user._id,
    title,
    message,
    type: 'period',
    actionUrl: '/dashboard',
    actionLabel: 'View Dashboard',
  });
};

const sendOvulationReminderNotification = async (user, ovulationDate) => {
  return createNotification({
    userId: user._id,
    title: '🥚 Ovulation Approaching',
    message: 'Your ovulation is predicted for today. Your fertile window is at its peak.',
    type: 'fertility',
    actionUrl: '/calendar',
    actionLabel: 'View Calendar',
    data: { ovulationDate },
  });
};

const sendHealthTipNotification = async (userId, tip) => {
  return createNotification({
    userId,
    title: `💡 Today's Health Tip`,
    message: tip.content,
    type: 'health',
    actionUrl: '/tips',
    data: { tipId: tip._id },
  });
};

const sendHygieneTipNotification = async (userId, tip) => {
  return createNotification({
    userId,
    title: `🧼 Today's Hygiene Tip`,
    message: tip.content,
    type: 'hygiene',
    actionUrl: '/tips',
    data: { tipId: tip._id },
  });
};

const sendInspirationNotification = async (userId, inspiration) => {
  return createNotification({
    userId,
    title: `✨ Daily Encouragement`,
    message: inspiration.content,
    type: 'general',
    data: { inspirationId: inspiration._id },
  });
};

const sendWaterReminderNotification = async (userId) => {
  return createNotification({
    userId,
    title: '💧 Hydration Reminder',
    message: 'Time to drink some water! Staying hydrated helps with cramps and overall health.',
    type: 'reminder',
  });
};

const sendSleepReminderNotification = async (userId) => {
  return createNotification({
    userId,
    title: '😴 Sleep Reminder',
    message: 'Time to wind down. Quality sleep is essential for hormonal balance.',
    type: 'reminder',
  });
};

const sendExerciseReminderNotification = async (userId) => {
  return createNotification({
    userId,
    title: '🏃‍♀️ Movement Reminder',
    message: 'Move your body today! Even a 20-minute walk can help ease symptoms.',
    type: 'reminder',
  });
};

const sendChatNotification = async (userId, senderName, messagePreview) => {
  return createNotification({
    userId,
    title: `💬 New message from ${senderName}`,
    message: messagePreview.substring(0, 100),
    type: 'general',
    actionUrl: '/chat',
    actionLabel: 'Open Chat',
  });
};

// ============================================
// Helper: Default title per type
// ============================================
const getDefaultTitle = (type) => {
  const titles = {
    period: '🌸 Period Update',
    fertility: '🥚 Fertility Update',
    health: '💡 Health Tip',
    hygiene: '🧼 Hygiene Tip',
    reminder: '🔔 Reminder',
    general: '📢 Notification',
  };
  return titles[type] || '🔔 Notification';
};

module.exports = {
  setSocketIO,
  createNotification,
  broadcastNotification,
  sendPeriodReminderNotification,
  sendOvulationReminderNotification,
  sendHealthTipNotification,
  sendHygieneTipNotification,
  sendInspirationNotification,
  sendWaterReminderNotification,
  sendSleepReminderNotification,
  sendExerciseReminderNotification,
  sendChatNotification,
};