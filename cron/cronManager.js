// ============================================
// cron/cronManager.js
// Node-cron scheduled jobs
// ============================================
const cron = require('node-cron');
const User = require('../models/User');
const Cycle = require('../models/Cycle');
const HealthTip = require('../models/HealthTip');
const HygieneTip = require('../models/HygieneTip');
const Inspiration = require('../models/Inspiration');
const Settings = require('../models/Settings');
const {
  sendPeriodReminderNotification,
  sendOvulationReminderNotification,
  sendWaterReminderNotification,
  sendSleepReminderNotification,
  sendExerciseReminderNotification,
  sendHealthTipNotification,
  sendHygieneTipNotification,
  sendInspirationNotification,
} = require('../services/notificationService');
const dayjs = require('dayjs');
const logger = require('../utils/logger');

// ============================================
// Helpers
// ============================================
const getRandomActive = async (Model) => {
  const count = await Model.countDocuments({ isActive: true });
  if (count === 0) return null;
  const randomIndex = Math.floor(Math.random() * count);
  return await Model.findOne({ isActive: true }).skip(randomIndex);
};

const getActiveUsers = async () => {
  return await User.find({
    isActive: true,
    isDeleted: false,
    status: 'active',
  }).select('_id firstName lastName email');
};

// ============================================
// JOB 1: Period reminders (checks all users' latest cycle)
// Runs every day at 8:00 AM
// ============================================
const periodReminderJob = async () => {
  logger.info('⏰ Running period reminder job...');
  try {
    const users = await getActiveUsers();
    let notified = 0;

    for (const user of users) {
      const lastCycle = await Cycle.findOne({ userId: user._id }).sort({ startDate: -1 });
      if (!lastCycle) continue;

      const cycleLength = lastCycle.cycleLength || 28;
      const nextPeriod = dayjs(lastCycle.startDate).add(cycleLength, 'day');
      const daysUntil = nextPeriod.diff(dayjs().startOf('day'), 'day');

      // Notify at 3 days, 1 day, and 0 days
      if ([3, 1, 0].includes(daysUntil)) {
        await sendPeriodReminderNotification(user, daysUntil);
        notified++;
      }
    }

    logger.info(`✅ Period reminder: notified ${notified} users`);
  } catch (err) {
    logger.error(`❌ Period reminder failed: ${err.message}`);
  }
};

// ============================================
// JOB 2: Ovulation reminders
// Runs every day at 8:00 AM
// ============================================
const ovulationReminderJob = async () => {
  logger.info('⏰ Running ovulation reminder job...');
  try {
    const users = await getActiveUsers();
    let notified = 0;

    for (const user of users) {
      const lastCycle = await Cycle.findOne({ userId: user._id }).sort({ startDate: -1 });
      if (!lastCycle) continue;

      const cycleLength = lastCycle.cycleLength || 28;
      const ovulationDate = dayjs(lastCycle.startDate).add(cycleLength - 14, 'day');
      const daysUntilOvulation = ovulationDate.diff(dayjs().startOf('day'), 'day');

      // Notify on ovulation day only
      if (daysUntilOvulation === 0) {
        await sendOvulationReminderNotification(user, ovulationDate.toDate());
        notified++;
      }
    }

    logger.info(`✅ Ovulation reminder: notified ${notified} users`);
  } catch (err) {
    logger.error(`❌ Ovulation reminder failed: ${err.message}`);
  }
};

// ============================================
// JOB 3: Daily health tip
// Runs at 9:00 AM
// ============================================
const dailyHealthTipJob = async () => {
  logger.info('⏰ Running daily health tip job...');
  try {
    const tip = await getRandomActive(HealthTip);
    if (!tip) {
      logger.warn('No health tips available');
      return;
    }

    const users = await getActiveUsers();

    for (const user of users) {
      const settings = await Settings.findOne({ userId: user._id });
      if (!settings?.notificationSettings?.inAppNotifications) continue;

      await sendHealthTipNotification(user._id, tip);
    }

    await HealthTip.findByIdAndUpdate(tip._id, { $inc: { viewCount: 1 } });
    logger.info(`✅ Health tip "${tip.title}" sent to ${users.length} users`);
  } catch (err) {
    logger.error(`❌ Health tip job failed: ${err.message}`);
  }
};

// ============================================
// JOB 4: Daily hygiene tip
// Runs at 9:30 AM
// ============================================
const dailyHygieneTipJob = async () => {
  logger.info('⏰ Running daily hygiene tip job...');
  try {
    const tip = await getRandomActive(HygieneTip);
    if (!tip) {
      logger.warn('No hygiene tips available');
      return;
    }

    const users = await getActiveUsers();

    for (const user of users) {
      await sendHygieneTipNotification(user._id, tip);
    }

    await HygieneTip.findByIdAndUpdate(tip._id, { $inc: { viewCount: 1 } });
    logger.info(`✅ Hygiene tip "${tip.title}" sent to ${users.length} users`);
  } catch (err) {
    logger.error(`❌ Hygiene tip job failed: ${err.message}`);
  }
};

// ============================================
// JOB 5: Daily inspiration
// Runs at 7:00 AM
// ============================================
const dailyInspirationJob = async () => {
  logger.info('⏰ Running daily inspiration job...');
  try {
    const inspiration = await getRandomActive(Inspiration);
    if (!inspiration) {
      logger.warn('No inspirations available');
      return;
    }

    const users = await getActiveUsers();

    for (const user of users) {
      await sendInspirationNotification(user._id, inspiration);
    }

    await Inspiration.findByIdAndUpdate(inspiration._id, { $inc: { viewCount: 1 } });
    logger.info(`✅ Inspiration sent to ${users.length} users`);
  } catch (err) {
    logger.error(`❌ Inspiration job failed: ${err.message}`);
  }
};

// ============================================
// JOB 6: Water reminders (multiple times/day)
// Runs at 10 AM, 1 PM, 4 PM, 7 PM
// ============================================
const waterReminderJob = async () => {
  logger.info('⏰ Running water reminder job...');
  try {
    const users = await getActiveUsers();
    for (const user of users) {
      await sendWaterReminderNotification(user._id);
    }
    logger.info(`✅ Water reminder sent to ${users.length} users`);
  } catch (err) {
    logger.error(`❌ Water reminder failed: ${err.message}`);
  }
};

// ============================================
// JOB 7: Exercise reminder — 6 PM
// ============================================
const exerciseReminderJob = async () => {
  logger.info('⏰ Running exercise reminder job...');
  try {
    const users = await getActiveUsers();
    for (const user of users) {
      await sendExerciseReminderNotification(user._id);
    }
    logger.info(`✅ Exercise reminder sent to ${users.length} users`);
  } catch (err) {
    logger.error(`❌ Exercise reminder failed: ${err.message}`);
  }
};

// ============================================
// JOB 8: Sleep reminder — 10 PM
// ============================================
const sleepReminderJob = async () => {
  logger.info('⏰ Running sleep reminder job...');
  try {
    const users = await getActiveUsers();
    for (const user of users) {
      await sendSleepReminderNotification(user._id);
    }
    logger.info(`✅ Sleep reminder sent to ${users.length} users`);
  } catch (err) {
    logger.error(`❌ Sleep reminder failed: ${err.message}`);
  }
};

// ============================================
// Initialize all cron jobs
// ============================================
const initializeCronJobs = () => {
  logger.info('📅 Initializing cron jobs...');

  // 7:00 AM — Daily inspiration
  cron.schedule('0 7 * * *', dailyInspirationJob, { timezone: 'UTC' });

  // 8:00 AM — Period & ovulation reminders
  cron.schedule(
    '0 8 * * *',
    async () => {
      await periodReminderJob();
      await ovulationReminderJob();
    },
    { timezone: 'UTC' }
  );

  // 9:00 AM — Health tip
  cron.schedule('0 9 * * *', dailyHealthTipJob, { timezone: 'UTC' });

  // 9:30 AM — Hygiene tip
  cron.schedule('30 9 * * *', dailyHygieneTipJob, { timezone: 'UTC' });

  // 10 AM, 1 PM, 4 PM, 7 PM — Water reminders
  cron.schedule('0 10,13,16,19 * * *', waterReminderJob, { timezone: 'UTC' });

  // 6 PM — Exercise reminder
  cron.schedule('0 18 * * *', exerciseReminderJob, { timezone: 'UTC' });

  // 10 PM — Sleep reminder
  cron.schedule('0 22 * * *', sleepReminderJob, { timezone: 'UTC' });

  logger.info('✅ All cron jobs initialized');
};

module.exports = { initializeCronJobs };