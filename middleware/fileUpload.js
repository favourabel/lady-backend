// ============================================
// File Upload Middleware (Cloudinary + Multer)
// ============================================
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/Cloudinary');
const { ValidationError } = require('../utils/errors');

// ============================================
// Cloudinary Storage Config
// ============================================
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Organize uploads into folders by user
    const userFolder = req.user?._id?.toString() || req.admin?._id?.toString() || 'temp';

    return {
      folder: `mylady/${userFolder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' },
      ],
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
});

// ============================================
// File Filter (validate file type)
// ============================================
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!allowedMimes.includes(file.mimetype)) {
    return cb(
      new ValidationError('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'),
      false
    );
  }

  cb(null, true);
};

// ============================================
// Multer Instance
// ============================================
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
});

// ============================================
// Middleware Exports
// ============================================

// Single file upload (e.g., profile picture)
const uploadSingle = (fieldName = 'file') => upload.single(fieldName);

// Multiple files upload (e.g., gallery)
const uploadMultiple = (fieldName = 'files', maxFiles = 5) =>
  upload.array(fieldName, maxFiles);

// Delete file from Cloudinary (call inside controllers)
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.warn('Failed to delete file from Cloudinary:', error.message);
    return null;
  }
};

// Validate that a file was actually uploaded
const validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return next(new ValidationError('No file uploaded'));
  }
  next();
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  deleteFromCloudinary,
  validateFileUpload,
};