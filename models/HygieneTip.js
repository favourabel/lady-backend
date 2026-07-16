// ============================================
// Hygiene Tip Model
// ============================================
const mongoose = require('mongoose');

const hygieneTipSchema = new mongoose.Schema(
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
        'personal-hygiene',
        'sanitary-products',
        'intimate-care',
        'infection-prevention',
        'bathing-tips',
        'underwear-care',
        'disposal',
        'general-tips',
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
    warnings: [String],
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
hygieneTipSchema.index({ isActive: 1, priority: -1 });
hygieneTipSchema.index({ category: 1 });

const HygieneTip = mongoose.model('HygieneTip', hygieneTipSchema);
module.exports = HygieneTip;