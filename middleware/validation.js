// ============================================
// Validation Middleware
// ============================================
const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

// ============================================
// Handle express-validator errors
// ============================================
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = {};

    errors.array().forEach((err) => {
      const field = err.param || err.path || 'unknown';
      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      formattedErrors[field].push(err.msg);
    });

    logger.warn(`Validation errors on ${req.path}: ${JSON.stringify(formattedErrors)}`);

    const errorMessage = Object.values(formattedErrors).flat().join(', ');
    return next(new ValidationError(errorMessage));
  }

  next();
};

// ============================================
// Sanitize request data (trim + strip HTML)
// ============================================
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim().replace(/[<>]/g, '');
      }
    });
  };

  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);

  next();
};

// ============================================
// Pagination validator
// ============================================
const validatePagination = (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;

  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

  req.pagination = { page, limit, skip: (page - 1) * limit };
  next();
};

// ============================================
// Content-Type validator
// ============================================
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];

    if (
      !contentType ||
      (!contentType.includes('application/json') &&
        !contentType.includes('multipart/form-data'))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Content-Type must be application/json or multipart/form-data',
      });
    }
  }
  next();
};

module.exports = {
  handleValidationErrors,
  sanitizeInput,
  validatePagination,
  validateContentType,
};