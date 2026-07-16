// ============================================
// Notification Routes (User-Facing)
// ============================================
const express = require('express');
const asyncHandler = require('../utils/asyncHandlers');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/Auth');
const { validatePagination } = require('../middleware/validation');
const { NotFoundError } = require('../utils/errors');

const router = express.Router();

// All routes are protected
router.use(protect);

// ============================================
// @route   GET /api/notifications
// @desc    Get user's notifications (paginated)
// @access  Private
// ============================================
router.get(
  '/',
  validatePagination,
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = req.pagination;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip),
      Notification.countDocuments({ userId: req.user._id }),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  })
);

// ============================================
// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
// ============================================
router.get(
  '/unread-count',
  asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: { count },
    });
  })
);

// ============================================
// @route   PUT /api/notifications/:id/read
// @desc    Mark single notification as read
// @access  Private
// ============================================
router.put(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: { notification },
    });
  })
);

// ============================================
// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
// ============================================
router.put(
  '/read-all',
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  })
);

// ============================================
// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
// ============================================
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  })
);

module.exports = router;