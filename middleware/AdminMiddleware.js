// ============================================
// Admin Authentication Middleware
// ============================================
const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/apiResponse');
const Admin = require('../models/Admin'); // We'll create this in Phase 2

const protectAdmin = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return error(res, 401, 'Not authorized, no token provided');
    }

    const decoded = verifyToken(token);

    // Ensure token belongs to an admin
    if (decoded.role !== 'admin') {
      return error(res, 403, 'Admin access required');
    }

    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return error(res, 401, 'Admin no longer exists');
    }

    req.admin = admin;
    next();
  } catch (err) {
    return error(res, 401, 'Not authorized, invalid token');
  }
};

module.exports = { protectAdmin };