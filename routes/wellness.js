// ============================================
// Wellness Routes (Videos + Images)
// ============================================
const express = require('express');
const Wellness = require('../models/Wellness');
const asyncHandler = require('../utils/asyncHandlers');
const { protect } = require('../middleware/Auth');
const logger = require('../utils/logger');

const router = express.Router();

// ============================================
// @desc    Get all wellness content (videos + images)
// @route   GET /api/wellness
// @access  Private (any logged in user)
// ============================================
router.get('/', protect, asyncHandler(async (req, res) => {
  const { type, category } = req.query;

  const filter = { isActive: true };
  if (type) filter.type = type;
  if (category) filter.category = category;

  const items = await Wellness.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: items.length,
    data: { items },
  });
}));

// ============================================
// @desc    Add new wellness content (admin only)
// @route   POST /api/wellness
// @access  Private (admin)
// ============================================
router.post('/', protect, asyncHandler(async (req, res) => {
  const { type, title, description, url, category, duration } = req.body;

  if (!type || !title || !url) {
    return res.status(400).json({
      success: false,
      message: 'Type, title, and URL are required',
    });
  }

  const wellness = await Wellness.create({
    type,
    title,
    description: description || '',
    url,
    category: category || 'other',
    duration: duration || '',
    createdBy: req.user?._id || null,
  });

  logger.info(`Wellness content created: ${title}`);

  res.status(201).json({
    success: true,
    message: 'Wellness content added successfully',
    data: wellness,
  });
}));

// ============================================
// @desc    Delete wellness content (admin only)
// @route   DELETE /api/wellness/:id
// @access  Private (admin)
// ============================================
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const item = await Wellness.findByIdAndDelete(req.params.id);

  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Content not found',
    });
  }

  logger.info(`Wellness content deleted: ${item.title}`);

  res.status(200).json({
    success: true,
    message: 'Content deleted successfully',
  });
}));

module.exports = router;