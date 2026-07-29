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

// ============================================================
// ✅ SPECIFIC ROUTES MUST COME FIRST (before /:id route)
// ============================================================

// GET /api/cycle/predictions            → Get current cycle predictions
router.get('/predictions', getPredictions);

// ✅ NEW: GET /api/cycle/history        → Alias for getCycles (returns all user's cycles)
router.get('/history', validatePagination, (req, res, next) => {
  // Wrap the response to always return { cycles: [...] } format for frontend
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    // If controller returns { data: { cycles: [...] } } — pass through
    // If it returns { cycles: [...] } — wrap in { data: ... }
    // If it returns [...] directly — wrap it
    if (data?.data?.cycles) return originalJson(data);
    if (data?.cycles) return originalJson({ success: true, data });
    if (Array.isArray(data)) return originalJson({ success: true, data: { cycles: data } });
    return originalJson(data);
  };
  getCycles(req, res, next);
});

// GET /api/cycle/calendar/:year/:month  → Get calendar data for month
router.get('/calendar/:year/:month', getCalendarData);

// ============================================================
// GENERIC ROUTES (must come after specific ones)
// ============================================================

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