// ============================================
// Standard API Response Format
// ============================================

// Success response
const success = (res, statusCode = 200, message = 'Success', data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// Error response
const error = (res, statusCode = 500, message = 'Server Error', errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = { success, error };