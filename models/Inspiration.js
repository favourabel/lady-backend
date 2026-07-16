// ============================================
// Inspiration/Spiritual Tip Model
// ============================================
const mongoose = require('mongoose');

const inspirationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      default: null,
    },
    content: {
      type: String,
      required: [true, 'Inspiration content is required'],
      minlength: [10, 'Content must be at least 10 characters'],
      maxlength: [1000, 'Content cannot exceed 1000 characters'],
    },
    author: {
      type: String,
      default: 'Anonymous',
    },
    category: {
      type: String,
      enum: [
        'hope',
        'gratitude',
        'peace',
        'resilience',
        'kindness',
        'self-care',
        'strength',
        'motivation',
        'acceptance',
        'community',
      ],
      required: true,
    },
    theme: {
      type: String,
      enum: ['general', 'menstrual-health', 'womens-health', 'wellness'],
      default: 'general',
    },
    language: {
      type: String,
      enum: ['en', 'es', 'fr', 'de', 'pt', 'hi'],
      default: 'en',
    },
    icon: { type: String, default: null },
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
    likes: {
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
inspirationSchema.index({ isActive: 1, priority: -1 });
inspirationSchema.index({ language: 1, category: 1 });

const Inspiration = mongoose.model('Inspiration', inspirationSchema);
module.exports = Inspiration;