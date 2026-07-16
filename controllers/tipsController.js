// ============================================
// Tips Controllers (Health, Hygiene, Spiritual/Inspiration)
// ============================================
const HealthTip = require('../models/HealthTip');
const HygieneTip = require('../models/HygieneTip');
const Inspiration = require('../models/Inspiration');
const asyncHandler = require('../utils/asyncHandlers');

// ============================================
// Helper: Rotate tip based on day of year
// ============================================
const getDailyRotatedTip = (tips) => {
  if (!tips || tips.length === 0) return null;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return tips[dayOfYear % tips.length];
};

// ============================================
// @desc    Get daily health tip (rotates by day)
// @route   GET /api/tips/health/daily
// @access  Private
// ============================================
const getDailyHealthTip = asyncHandler(async (req, res) => {
  const activeTips = await HealthTip.find({ isActive: true }).sort({ priority: -1 });

  const tip = getDailyRotatedTip(activeTips);

  if (tip) {
    tip.viewCount += 1;
    await tip.save();
  }

  res.status(200).json({
    success: true,
    data: { tip },
  });
});

// ============================================
// @desc    Get daily hygiene tip
// @route   GET /api/tips/hygiene/daily
// @access  Private
// ============================================
const getDailyHygieneTip = asyncHandler(async (req, res) => {
  const activeTips = await HygieneTip.find({ isActive: true }).sort({ priority: -1 });

  const tip = getDailyRotatedTip(activeTips);

  if (tip) {
    tip.viewCount += 1;
    await tip.save();
  }

  res.status(200).json({
    success: true,
    data: { tip },
  });
});

// ============================================
// @desc    Get daily inspiration (spiritual tip)
// @route   GET /api/tips/inspiration/daily
// @access  Private
// ============================================
const getDailyInspiration = asyncHandler(async (req, res) => {
  const activeTips = await Inspiration.find({ isActive: true }).sort({ priority: -1 });

  const tip = getDailyRotatedTip(activeTips);

  if (tip) {
    tip.viewCount += 1;
    await tip.save();
  }

  res.status(200).json({
    success: true,
    data: { tip },
  });
});

// ============================================
// @desc    Get ALL 3 daily tips at once (perfect for dashboard)
// @route   GET /api/tips/daily
// @access  Private
// ============================================
const getAllDailyTips = asyncHandler(async (req, res) => {
  const [healthTips, hygieneTips, inspirationTips] = await Promise.all([
    HealthTip.find({ isActive: true }).sort({ priority: -1 }),
    HygieneTip.find({ isActive: true }).sort({ priority: -1 }),
    Inspiration.find({ isActive: true }).sort({ priority: -1 }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      health: getDailyRotatedTip(healthTips),
      hygiene: getDailyRotatedTip(hygieneTips),
      spiritual: getDailyRotatedTip(inspirationTips),
    },
  });
});

// ============================================
// @desc    Get all active health tips (list view)
// @route   GET /api/tips/health
// @access  Private
// ============================================
const getAllHealthTips = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;

  const tips = await HealthTip.find(filter)
    .sort({ priority: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await HealthTip.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      tips,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// ============================================
// @desc    Get all active hygiene tips
// @route   GET /api/tips/hygiene
// @access  Private
// ============================================
const getAllHygieneTips = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;

  const tips = await HygieneTip.find(filter)
    .sort({ priority: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await HygieneTip.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      tips,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// ============================================
// @desc    Get all active inspirations (spiritual tips)
// @route   GET /api/tips/inspiration
// @access  Private
// ============================================
const getAllInspirations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;

  const tips = await Inspiration.find(filter)
    .sort({ priority: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Inspiration.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      tips,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

module.exports = {
  getDailyHealthTip,
  getDailyHygieneTip,
  getDailyInspiration,
  getAllDailyTips,
  getAllHealthTips,
  getAllHygieneTips,
  getAllInspirations,
};