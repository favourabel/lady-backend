// ============================================
// Tips Routes (User-Facing)
// ============================================
const express = require('express');
const {
  getDailyHealthTip,
  getDailyHygieneTip,
  getDailyInspiration,
  getAllDailyTips,
  getAllHealthTips,
  getAllHygieneTips,
  getAllInspirations,
} = require('../controllers/tipsController');
const { protect } = require('../middleware/Auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all 3 daily tips at once (best for dashboard!)
router.get('/daily', getAllDailyTips);

// Daily tips (single)
router.get('/health/daily', getDailyHealthTip);
router.get('/hygiene/daily', getDailyHygieneTip);
router.get('/inspiration/daily', getDailyInspiration);

// List all active tips
router.get('/health', getAllHealthTips);
router.get('/hygiene', getAllHygieneTips);
router.get('/inspiration', getAllInspirations);

module.exports = router;