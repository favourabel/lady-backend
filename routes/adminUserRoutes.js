// routes/adminUserRoutes.js
const express = require('express');
const asyncHandler = require('../utils/asyncHandlers');
const { adminProtect } = require('../middleware/Auth');
const User = require('../models/User');

const router = express.Router();
router.use(adminProtect);

// GET /api/admin/users
router.get('/', asyncHandler(async (req, res) => {
  const users = await User.find({ isDeleted: false })
    .select('firstName lastName email status isActive lastLogin createdAt')
    .sort({ createdAt: -1 });

  const formatted = users.map(u => ({
    _id: u._id,
    name: u.fullName || `${u.firstName} ${u.lastName}`,
    email: u.email,
    status: u.status,
    isActive: u.isActive,
    joined: u.createdAt,
    lastActive: u.lastLogin,
  }));

  res.json({ success: true, data: { users: formatted } });
}));

// PATCH /api/admin/users/:id/status
router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status, isActive: status === 'active' },
    { new: true }
  );
  res.json({ success: true, data: { user } });
}));

// DELETE /api/admin/users/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedAt: new Date() });
  res.json({ success: true, message: 'User deleted' });
}));

module.exports = router;