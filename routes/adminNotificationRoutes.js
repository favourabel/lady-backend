// ============================================
// routes/adminNotificationRoutes.js
// Admin sends notifications to all users or specific user
// ============================================
const express = require('express');
const asyncHandler = require('../utils/asyncHandlers');
const { adminProtect } = require('../middleware/Auth');
const Notification = require('../models/Notification');
const User = require('../models/User');
const {
  createNotification,
  broadcastNotification,
} = require('../services/notificationService');

const router = express.Router();

router.use(adminProtect);

// ============================================
// POST /api/admin/notifications/send
// ============================================
router.post(
  '/send',
  asyncHandler(async (req, res) => {
    const { target, title, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const adminId = req.admin?._id;

    if (target === 'all' || !target) {
      const users = await User.find({ isActive: true }).select('_id');
      const userIds = users.map((u) => u._id);

      if (userIds.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No active users to notify',
          data: { count: 0 },
        });
      }

      const created = await broadcastNotification({
        userIds,
        title: title || 'Announcement',
        message: message.trim(),
        type: 'general',
        sentBy: adminId,
      });

      return res.status(201).json({
        success: true,
        message: `Notification sent to ${created.length} users`,
        data: { count: created.length },
      });
    }

    const notification = await createNotification({
      userId: target,
      title: title || 'Notification',
      message: message.trim(),
      type: 'general',
      sentBy: adminId,
    });

    return res.status(201).json({
      success: true,
      message: 'Notification sent',
      data: { notification },
    });
  })
);

// ============================================
// GET /api/admin/notifications/sent
// ============================================
router.get(
  '/sent',
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ sentBy: { $ne: null } })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('userId', 'firstName lastName email');

    res.json({ success: true, data: { notifications } });
  })
);

// ============================================
// ✅ DELETE /api/admin/notifications/:id
// Deletes broadcast group + emits socket event
// ============================================
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notif = await Notification.findById(id);
    if (!notif) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    let deletedIds = [id];
    let affectedUserIds = [notif.userId];

    if (notif.sentBy) {
      const sameGroup = await Notification.find({
        sentBy: notif.sentBy,
        message: notif.message,
        title: notif.title,
        createdAt: {
          $gte: new Date(notif.createdAt.getTime() - 5000),
          $lte: new Date(notif.createdAt.getTime() + 5000),
        },
      }).select('_id userId');

      if (sameGroup.length > 1) {
        deletedIds = sameGroup.map((n) => n._id.toString());
        affectedUserIds = sameGroup.map((n) => n.userId);
        await Notification.deleteMany({ _id: { $in: deletedIds } });
      } else {
        await Notification.findByIdAndDelete(id);
      }
    } else {
      await Notification.findByIdAndDelete(id);
    }

    // ✅ Emit socket event via getIO() from your socket manager
    try {
      const { getIO } = require('../sockets/socketManager');
      const io = getIO();
      if (io) {
        affectedUserIds.forEach((userId) => {
          if (userId) {
            io.to(`user:${userId.toString()}`).emit('notification:deleted', {
              notificationIds: deletedIds,
            });
          }
        });
        console.log(`🗑️ Emitted notification:deleted to ${affectedUserIds.length} user(s)`);
      }
    } catch (err) {
      console.log('Socket emit failed (non-fatal):', err.message);
    }

    res.json({
      success: true,
      message: `Deleted ${deletedIds.length} notification(s)`,
      data: { deletedCount: deletedIds.length },
    });
  })
);

module.exports = router;