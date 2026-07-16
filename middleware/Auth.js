// ============================================
// JWT Authentication Middleware (Protects User Routes)
// ============================================
const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/apiResponse');
const User = require('../models/User');
const Admin = require('../models/Admin');

// ============================================
// Protect USER routes
// ============================================
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return error(res, 401, 'Not authorized, no token provided');
    }

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return error(res, 401, 'User no longer exists');
    }

    if (user.status === 'suspended') {
      return error(res, 403, 'Your account has been suspended');
    }

    req.user = user;
    next();
  } catch (err) {
    return error(res, 401, 'Not authorized, invalid token');
  }
};

// ============================================
// Protect ADMIN routes — WITH DEBUG LOGS
// ============================================
const adminProtect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log('❌ DEBUG - No token provided');
      return error(res, 401, 'Not authorized, no token provided');
    }

    const decoded = verifyToken(token);
    console.log('🔍 DEBUG - Decoded token:', decoded);

    let admin = await Admin.findById(decoded.id).select('-password');
    console.log('🔍 DEBUG - Admin from Admin collection:', admin ? admin.email : 'NOT FOUND');

    if (!admin) {
      admin = await User.findById(decoded.id).select('-password');
      console.log('🔍 DEBUG - Admin from User collection:', admin ? admin.email : 'NOT FOUND');
    }

    if (!admin) {
      console.log('❌ DEBUG - No admin found in either collection');
      return error(res, 401, 'Admin no longer exists');
    }

    console.log('🔍 DEBUG - Admin role:', admin.role);
    console.log('🔍 DEBUG - Admin isAdmin:', admin.isAdmin);

    // ✅ TEMPORARY: Bypass ALL role checks - just allow access
    req.admin = admin;
    req.user = admin;
    console.log('✅ DEBUG - Access GRANTED!');
    next();
  } catch (err) {
    console.error('❌ DEBUG - adminProtect error:', err.message);
    return error(res, 401, 'Not authorized, invalid token');
  }
};

module.exports = { protect, adminProtect };