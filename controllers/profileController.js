// ============================================
// Profile Controllers
// ============================================
const User = require('../models/User');
const Profile = require('../models/Profile');
const asyncHandler = require('../utils/asyncHandlers');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { deleteFromCloudinary } = require('../middleware/fileUpload');
const logger = require('../utils/logger');

// ============================================
// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
// ============================================
const getProfile = asyncHandler(async (req, res) => {
  let profile = await Profile.findOne({ userId: req.user._id });

  // Auto-create profile if missing
  if (!profile) {
    profile = await Profile.create({ userId: req.user._id });
  }

  res.status(200).json({
    success: true,
    data: {
      user: req.user.getProfile ? req.user.getProfile() : req.user,
      profile,
    },
  });
});

// ============================================
// @desc    Update user profile (health data)
// @route   PUT /api/profile
// @access  Private
// ============================================
const updateProfile = asyncHandler(async (req, res) => {
  const {
    height,
    weight,
    bloodType,
    medicalConditions,
    medications,
    allergies,
    healthGoals,
    fitnessLevel,
    stressLevel,
    sleepAveragePerNight,
    medicalNotes,
    emergencyContact,
  } = req.body;

  let profile = await Profile.findOne({ userId: req.user._id });

  if (!profile) {
    profile = await Profile.create({ userId: req.user._id });
  }

  const updateFields = {
    height,
    weight,
    bloodType,
    medicalConditions,
    medications,
    allergies,
    healthGoals,
    fitnessLevel,
    stressLevel,
    sleepAveragePerNight,
    medicalNotes,
    emergencyContact,
  };

  Object.keys(updateFields).forEach((key) => {
    if (updateFields[key] !== undefined) {
      profile[key] = updateFields[key];
    }
  });

  profile.calculateCompletion();
  await profile.save();

  logger.info(`Profile updated for user: ${req.user.email}`);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { profile },
  });
});

// ============================================
// @desc    Update user account (name, phone, etc.)
// @route   PUT /api/profile/account
// @access  Private
// ============================================
const updateUserAccount = asyncHandler(async (req, res) => {
  const { firstName, lastName, username, phone, dateOfBirth, country, language } = req.body;

  // Handle username field (single name) from frontend
  const updateData = {};

  if (username) {
    const parts = username.trim().split(' ');
    updateData.firstName = parts[0];
    updateData.lastName = parts.slice(1).join(' ') || parts[0];
  } else {
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
  }

  if (phone !== undefined) updateData.phone = phone;
  if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
  if (country !== undefined) updateData.country = country;
  if (language !== undefined) updateData.language = language;

  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  logger.info(`Account updated for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Account updated successfully',
    data: { user: user.getProfile() },
  });
});

// ============================================
// @desc    Upload profile picture (Cloudinary)
// @route   POST /api/profile/avatar
// @access  Private
// ============================================
const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  // Get old picture to delete from Cloudinary
  const oldUser = await User.findById(req.user._id);
  const oldPictureUrl = oldUser?.profilePicture;

  // Cloudinary URL is in req.file.path (multer-storage-cloudinary)
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profilePicture: req.file.path },
    { new: true }
  );

  // Delete old picture from Cloudinary (if it existed)
  if (oldPictureUrl && oldPictureUrl.includes('cloudinary')) {
    try {
      // Extract public_id from Cloudinary URL
      const parts = oldPictureUrl.split('/');
      const publicId = parts.slice(-3).join('/').split('.')[0];
      await deleteFromCloudinary(publicId);
    } catch (err) {
      logger.warn(`Failed to delete old avatar: ${err.message}`);
    }
  }

  logger.info(`Profile picture uploaded for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Profile picture uploaded successfully',
    data: { user: user.getProfile() },
  });
});

// ============================================
// @desc    Delete account (soft delete)
// @route   DELETE /api/profile
// @access  Private
// ============================================
const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    throw new ValidationError('Password is required to delete account');
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(password))) {
    throw new ValidationError('Incorrect password');
  }

  user.isDeleted = true;
  user.isActive = false;
  user.status = 'inactive';
  user.deletedAt = new Date();
  await user.save();

  logger.info(`Account deleted: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully',
  });
});

module.exports = {
  getProfile,
  updateProfile,
  updateUserAccount,
  uploadProfilePicture,
  deleteAccount,
};