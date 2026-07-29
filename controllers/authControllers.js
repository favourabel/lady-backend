// ============================================
// Auth Controllers (Signup, Login, Logout)
// ============================================
const User = require('../models/User');
const Admin = require('../models/Admin');
const Profile = require('../models/Profile');
const Settings = require('../models/Settings');
const Analytics = require('../models/Analytics');
const Cycle = require('../models/Cycle');
const asyncHandler = require('../utils/asyncHandlers');
const { generateToken } = require('../utils/jwt');
const {
  ValidationError,
  UnauthorizedError,
  ConflictError,
} = require('../utils/errors');
const { isValidEmail, sanitizeUserInput } = require('../utils/helpers');
const logger = require('../utils/logger');

// ============================================
// @desc    Register new user (with cycle info)
// @route   POST /api/auth/signup
// @access  Public
// ============================================
const register = asyncHandler(async (req, res) => {
  let {
    firstName,
    lastName,
    username,
    email,
    password,
    passwordConfirm,
    // ✅ Cycle-related fields from signup form
    lastPeriodDate,
    cycleLength,
    periodLength,
    irregularCycle,
    commonSymptoms,
  } = req.body;

  // Support both "username" (frontend) and "firstName/lastName" (admin)
  if (username && !firstName) {
    const parts = username.trim().split(' ');
    firstName = parts[0];
    lastName = parts.slice(1).join(' ') || parts[0];
  }

  // Validate required fields
  if (!firstName || !email || !password) {
    throw new ValidationError('Please provide name, email, and password');
  }

  if (!isValidEmail(email)) {
    throw new ValidationError('Please provide a valid email address');
  }

  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }

  if (passwordConfirm && password !== passwordConfirm) {
    throw new ValidationError('Passwords do not match');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Create user
  const user = await User.create({
    firstName: sanitizeUserInput(firstName),
    lastName: sanitizeUserInput(lastName || firstName),
    email: email.toLowerCase(),
    password,
  });

  // ✅ Prepare profile data (with symptoms + irregular cycle info)
  const profileData = {
    userId: user._id,
  };

  if (Array.isArray(commonSymptoms) && commonSymptoms.length > 0) {
    profileData.commonSymptoms = commonSymptoms;
  }

  // If user marked irregular cycle → add it to medical conditions
  if (irregularCycle === true || irregularCycle === 'yes') {
    profileData.medicalConditions = ['Irregular cycles'];
  }

  // Create associated documents
  await Promise.all([
    Profile.create(profileData),
    Settings.create({ userId: user._id }),
    Analytics.create({ userId: user._id }),
  ]);

  // ✅ Auto-create first Cycle entry if user provided period date
  if (lastPeriodDate) {
    try {
      await Cycle.create({
        userId: user._id,
        startDate: new Date(lastPeriodDate),
        cycleLength: Number(cycleLength) || 28,
        periodDuration: Number(periodLength) || 5,
        symptoms: [], // Cycle symptoms tracked separately from profile symptoms
      });
      logger.info(`Initial cycle created for user: ${user.email}`);
    } catch (cycleErr) {
      // Don't block signup if cycle creation fails — just log it
      logger.error(`Failed to create initial cycle for ${user.email}: ${cycleErr.message}`);
    }
  }

  // Generate JWT token
  const token = generateToken({
    id: user._id,
    role: user.role || 'user',
    type: 'user',
  });

  logger.info(`User registered: ${user.email}`);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        ...user.getProfile(),
        role: user.role || 'user',
        isAdmin: false,
      },
      token,
    },
  });
});

// ============================================
// @desc    Login user/admin
// @route   POST /api/auth/login
// @access  Public
// ============================================
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError('Please provide email and password');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // ============================================================
  // 1. Try normal USER login first
  // ============================================================
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (user) {
    if (!(await user.matchPassword(password))) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive || user.status === 'suspended') {
      throw new UnauthorizedError('Your account has been suspended. Contact support.');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const role = user.role || 'user';

    // Generate JWT
    const token = generateToken({
      id: user._id,
      role,
      type: role === 'admin' ? 'admin' : 'user',
    });

    logger.info(`User logged in: ${user.email}`);

    const profile = user.getProfile();

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          ...profile,
          role,
          isAdmin: role === 'admin',
        },
        token,
      },
    });
  }

  // ============================================================
  // 2. If not found in users, try ADMIN collection
  // ============================================================
  const admin = await Admin.findOne({ email: normalizedEmail }).select('+password');

  if (!admin) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!(await admin.matchPassword(password))) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (admin.isActive === false) {
    throw new UnauthorizedError('Admin account is inactive.');
  }

  // Update last login
  admin.lastLogin = new Date();
  await admin.save();

  // Generate admin JWT
  const token = generateToken({
    id: admin._id,
    role: 'admin',
    type: 'admin',
  });

  logger.info(`Admin logged in: ${admin.email}`);

  return res.status(200).json({
    success: true,
    message: 'Admin login successful',
    data: {
      user: {
        _id: admin._id,
        id: admin._id,
        name: admin.name,
        username: admin.name,
        firstName: admin.name,
        email: admin.email,
        avatar: admin.avatar || null,
        role: 'admin',
        originalRole: admin.role || 'Super Admin',
        isAdmin: true,
      },
      token,
    },
  });
});

// ============================================
// @desc    Logout user/admin
// @route   POST /api/auth/logout
// @access  Private
// ============================================
const logout = asyncHandler(async (req, res) => {
  logger.info(`User logged out: ${req.user?.email || req.admin?.email || 'unknown'}`);

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

// ============================================
// @desc    Get current logged-in user/admin
// @route   GET /api/auth/me
// @access  Private
// ============================================
const getCurrentUser = asyncHandler(async (req, res) => {
  // Normal user
  if (req.user) {
    const user = await User.findById(req.user._id || req.user.id);

    if (user) {
      const role = user.role || 'user';
      const profile = user.getProfile();

      return res.status(200).json({
        success: true,
        data: {
          user: {
            ...profile,
            role,
            isAdmin: role === 'admin',
          },
        },
      });
    }
  }

  // Admin user, if middleware sets req.admin
  if (req.admin) {
    const admin = await Admin.findById(req.admin._id || req.admin.id);

    if (admin) {
      return res.status(200).json({
        success: true,
        data: {
          user: {
            _id: admin._id,
            id: admin._id,
            name: admin.name,
            username: admin.name,
            firstName: admin.name,
            email: admin.email,
            avatar: admin.avatar || null,
            role: 'admin',
            originalRole: admin.role || 'Super Admin',
            isAdmin: true,
          },
        },
      });
    }
  }

  throw new UnauthorizedError('User not found');
});

// ============================================
// @desc    Change password (logged-in user)
// @route   PUT /api/auth/change-password
// @access  Private
// ============================================
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ValidationError('Please provide current and new password');
  }

  if (newPassword.length < 8) {
    throw new ValidationError('New password must be at least 8 characters');
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  if (!(await user.matchPassword(currentPassword))) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  logger.info(`Password changed for user: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  changePassword,
};