// ============================================
// Cycle Controllers
// ============================================
const Cycle = require('../models/Cycle');
const Analytics = require('../models/Analytics');
const asyncHandler = require('../utils/asyncHandlers');
const { NotFoundError, ValidationError } = require('../utils/errors');
const {
  predictNextPeriod,
  predictOvulation,
  predictFertileWindow,
  getDayOfCycle,
} = require('../utils/helpers');
const logger = require('../utils/logger');

// ============================================
// @desc    Create new cycle entry
// @route   POST /api/cycle
// @access  Private
// ============================================
const createCycle = asyncHandler(async (req, res) => {
  const {
    startDate,
    cycleLength,
    periodDuration,
    flowIntensity,
    mood,
    symptoms,
    notes,
  } = req.body;

  if (!startDate) {
    throw new ValidationError('Start date is required');
  }

  const cycle = await Cycle.create({
    userId: req.user._id,
    startDate,
    cycleLength,
    periodDuration,
    flowIntensity,
    mood,
    symptoms,
    notes,
  });

  // Update analytics
  const analytics = await Analytics.findOne({ userId: req.user._id });
  if (analytics) {
    analytics.totalCycles += 1;
    analytics.lastCycleDate = startDate;
    analytics.predictedNextCycleDate = predictNextPeriod(startDate, cycleLength || 28);
    await analytics.save();
  }

  logger.info(`Cycle created for user: ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Cycle entry created successfully',
    data: { cycle },
  });
});

// ============================================
// @desc    Get all cycles for current user
// @route   GET /api/cycle
// @access  Private
// ============================================
const getCycles = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.pagination || {};

  const cycles = await Cycle.find({ userId: req.user._id })
    .sort({ startDate: -1 })
    .limit(limit)
    .skip((page - 1) * limit);

  const total = await Cycle.countDocuments({ userId: req.user._id });

  res.status(200).json({
    success: true,
    data: {
      cycles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// ============================================
// @desc    Get single cycle
// @route   GET /api/cycle/:id
// @access  Private
// ============================================
const getCycle = asyncHandler(async (req, res) => {
  const cycle = await Cycle.findById(req.params.id);

  if (!cycle || cycle.userId.toString() !== req.user._id.toString()) {
    throw new NotFoundError('Cycle not found');
  }

  res.status(200).json({
    success: true,
    data: { cycle },
  });
});

// ============================================
// @desc    Update cycle
// @route   PUT /api/cycle/:id
// @access  Private
// ============================================
const updateCycle = asyncHandler(async (req, res) => {
  const cycle = await Cycle.findById(req.params.id);

  if (!cycle || cycle.userId.toString() !== req.user._id.toString()) {
    throw new NotFoundError('Cycle not found');
  }

  const allowedFields = [
    'endDate',
    'flowIntensity',
    'mood',
    'symptoms',
    'notes',
    'isCompleted',
    'temperature',
    'cervicalMucus',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      cycle[field] = req.body[field];
    }
  });

  await cycle.save();

  logger.info(`Cycle updated: ${cycle._id}`);

  res.status(200).json({
    success: true,
    message: 'Cycle updated successfully',
    data: { cycle },
  });
});

// ============================================
// @desc    Delete cycle
// @route   DELETE /api/cycle/:id
// @access  Private
// ============================================
const deleteCycle = asyncHandler(async (req, res) => {
  const cycle = await Cycle.findById(req.params.id);

  if (!cycle || cycle.userId.toString() !== req.user._id.toString()) {
    throw new NotFoundError('Cycle not found');
  }

  await Cycle.deleteOne({ _id: req.params.id });

  logger.info(`Cycle deleted: ${req.params.id}`);

  res.status(200).json({
    success: true,
    message: 'Cycle deleted successfully',
  });
});

// ============================================
// @desc    Get cycle predictions & current status
// @route   GET /api/cycle/predictions
// @access  Private
// ============================================
const getPredictions = asyncHandler(async (req, res) => {
  const lastCycle = await Cycle.findOne({ userId: req.user._id }).sort({ startDate: -1 });

  if (!lastCycle) {
    return res.status(200).json({
      success: true,
      message: 'No cycle data available yet',
      data: {
        predictions: null,
      },
    });
  }

  const cycleLength = lastCycle.cycleLength || 28;
  const periodDuration = lastCycle.periodDuration || 5;

  const nextPeriod = predictNextPeriod(lastCycle.startDate, cycleLength);
  const ovulation = predictOvulation(lastCycle.startDate, cycleLength);
  const fertileWindow = predictFertileWindow(lastCycle.startDate, cycleLength);
  const dayOfCycle = getDayOfCycle(lastCycle.startDate);

  // Days until next period
  const daysUntilPeriod = Math.max(
    0,
    Math.ceil((nextPeriod - new Date()) / (1000 * 60 * 60 * 24))
  );

  res.status(200).json({
    success: true,
    data: {
     predictions: {
  startDate: lastCycle.startDate,
  nextPeriod,
  ovulation,
  fertileWindow,
  dayOfCycle,
  daysUntilPeriod,
  cycleLength,
  periodDuration,
  currentPhase: lastCycle.phase,
},
    },
  });
});

// ============================================
// @desc    Get calendar data for a month
// @route   GET /api/cycle/calendar/:year/:month
// @access  Private
// ============================================
const getCalendarData = asyncHandler(async (req, res) => {
  const { year, month } = req.params;
  const y = parseInt(year, 10);
  const m = parseInt(month, 10) - 1; // JS months are 0-indexed

  const startOfMonth = new Date(y, m, 1);
  const endOfMonth = new Date(y, m + 1, 0);

  const cycles = await Cycle.find({
    userId: req.user._id,
    startDate: { $lte: endOfMonth },
  }).sort({ startDate: -1 });

  res.status(200).json({
    success: true,
    data: {
      year: y,
      month: m + 1,
      cycles,
    },
  });
});

module.exports = {
  createCycle,
  getCycles,
  getCycle,
  updateCycle,
  deleteCycle,
  getPredictions,
  getCalendarData,
};