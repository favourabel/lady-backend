// ============================================
// User Profile Routes
// ============================================
const express = require('express');
const {
  getProfile,
  updateProfile,
  updateUserAccount,
  uploadProfilePicture,
  deleteAccount,
} = require('../controllers/profileController');
const { protect } = require('../middleware/Auth');
const { uploadSingle } = require('../middleware/fileUpload');
const { sanitizeInput } = require('../middleware/validation');

const router = express.Router();

// All routes are protected
router.use(protect);

// GET  /api/user/profile         → Get profile
// PUT  /api/user/profile         → Update profile (health data)
router
  .route('/profile')
  .get(getProfile)
  .put(sanitizeInput, updateProfile);

// PUT  /api/user/account         → Update user account (name, phone, etc.)
router.put('/account', sanitizeInput, updateUserAccount);

// POST /api/user/avatar          → Upload profile picture (Cloudinary)
router.post('/avatar', uploadSingle('avatar'), uploadProfilePicture);

// DELETE /api/user                → Delete account (soft delete)
router.delete('/', sanitizeInput, deleteAccount);

module.exports = router;