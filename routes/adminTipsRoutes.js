// routes/adminTipsRoutes.js
const express = require('express');
const asyncHandler = require('../utils/asyncHandlers');
const { adminProtect } = require('../middleware/Auth');
const HealthTip = require('../models/HealthTip');
const HygieneTip = require('../models/HygieneTip');
const Inspiration = require('../models/Inspiration');

const router = express.Router();
router.use(adminProtect);

const getModel = (type) => {
  if (type === 'health') return HealthTip;
  if (type === 'hygiene') return HygieneTip;
  return Inspiration;
};

// GET /api/admin/tips?type=health|hygiene|inspiration
router.get('/', asyncHandler(async (req, res) => {
  const { type } = req.query;
  const Model = getModel(type);
  const tips = await Model.find().sort({ priority: -1, createdAt: -1 });
  res.json({ success: true, data: { tips } });
}));

// POST /api/admin/tips
router.post('/', asyncHandler(async (req, res) => {
  const { type, ...data } = req.body;
  const Model = getModel(type || 'health');
  const tip = await Model.create({ ...data, createdBy: req.admin._id });
  res.status(201).json({ success: true, data: { tip } });
}));

// PUT /api/admin/tips/:id
router.put('/:id', asyncHandler(async (req, res) => {
  const { type, ...data } = req.body;
  const Model = getModel(type || 'health');
  const tip = await Model.findByIdAndUpdate(req.params.id, data, { new: true });
  res.json({ success: true, data: { tip } });
}));

// DELETE /api/admin/tips/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  const { type } = req.query;
  const Model = getModel(type);
  await Model.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Tip deleted' });
}));

module.exports = router;