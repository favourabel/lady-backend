// ============================================
// Cycle Tracking Routes
// ============================================
const express = require('express');
const {
  createCycle,
  getCycles,
  getCycle,
  updateCycle,
  deleteCycle,
  getPredictions,
  getCalendarData,
} = require('../controllers/cycleController');
const { protect } = require('../middleware/Auth');
const { sanitizeInput, validatePagination } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

// GET  /api/cycle/predictions            → Get current cycle predictions
router.get('/predictions', getPredictions);

// GET  /api/cycle/calendar/:year/:month  → Get calendar data for month
router.get('/calendar/:year/:month', getCalendarData);

// GET  /api/cycle                        → Get all cycles (paginated)
// POST /api/cycle                        → Log new cycle
router
  .route('/')
  .get(validatePagination, getCycles)
  .post(sanitizeInput, createCycle);

// GET    /api/cycle/:id                  → Get single cycle
// PUT    /api/cycle/:id                  → Update cycle
// DELETE /api/cycle/:id                  → Delete cycle
router
  .route('/:id')
  .get(getCycle)
  .put(sanitizeInput, updateCycle)
  .delete(deleteCycle);

module.exports = router;