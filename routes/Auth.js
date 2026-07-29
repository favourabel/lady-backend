// ============================================
// Auth Routes
// ============================================
const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  logout,
  getCurrentUser,
  changePassword,
} = require('../controllers/authControllers');
const { protect } = require('../middleware/Auth');
const {
  handleValidationErrors,
  sanitizeInput,
} = require('../middleware/validation');

const router = express.Router();

// ============================================
// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
// ============================================
router.post(
  '/signup',
  sanitizeInput,
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    // Accept EITHER username OR firstName
    body().custom((value) => {
      if (!value.username && !value.firstName) {
        throw new Error('Please provide a name');
      }
      return true;
    }),
    // ✅ NEW: Optional cycle validations
    body('lastPeriodDate')
      .optional()
      .isISO8601()
      .withMessage('Last period date must be a valid date'),
    body('cycleLength')
      .optional()
      .isInt({ min: 15, max: 60 })
      .withMessage('Cycle length must be between 15 and 60 days'),
    body('periodLength')
      .optional()
      .isInt({ min: 2, max: 10 })
      .withMessage('Period length must be between 2 and 10 days'),
    body('irregularCycle')
      .optional()
      .custom((value) => {
        if (typeof value === 'boolean') return true;
        if (value === 'yes' || value === 'no') return true;
        throw new Error('Irregular cycle must be true, false, "yes" or "no"');
      }),
    body('commonSymptoms')
      .optional()
      .isArray()
      .withMessage('Common symptoms must be an array'),
  ],
  handleValidationErrors,
  register
);

// ============================================
// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
// ============================================
router.post(
  '/login',
  sanitizeInput,
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidationErrors,
  login
);

// ============================================
// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
// ============================================
router.post('/logout', protect, logout);

// ============================================
// @route   GET /api/auth/me
// @desc    Get current logged-in user
// @access  Private
// ============================================
router.get('/me', protect, getCurrentUser);

// ============================================
// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
// ============================================
router.put(
  '/change-password',
  protect,
  sanitizeInput,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters'),
  ],
  handleValidationErrors,
  changePassword
);

module.exports = router;