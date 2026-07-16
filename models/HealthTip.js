// ============================================
// Health Tip Model
// ============================================
const mongoose = require('mongoose');

const healthTipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      minlength: [10, 'Content must be at least 10 characters'],
    },
    category: {
      type: String,
      enum: [
        'nutrition',
        'exercise',
        'sleep',
        'stress-management',
        'hydration',
        'supplements',
        'general-wellness',
      ],
      required: true,
    },
    cyclePhase: [
      {
        type: String,
        enum: ['menstruation', 'follicular', 'ovulation', 'luteal', 'all'],
      },
    ],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    icon: { type: String, default: null },
    image: { type: String, default: null },
    sources: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
healthTipSchema.index({ isActive: 1, priority: -1 });
healthTipSchema.index({ category: 1 });

const HealthTip = mongoose.model('HealthTip', healthTipSchema);
module.exports = HealthTip;