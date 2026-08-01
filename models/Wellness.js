// ============================================
// Wellness Model (Videos + Images for users)
// ============================================
const mongoose = require('mongoose');

const wellnessSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['video', 'image'],
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
    },
    // For YouTube videos — extracted video ID for embed
    videoId: {
      type: String,
      default: null,
    },
    // Auto-generated YouTube thumbnail OR image URL
    thumbnail: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['yoga', 'meditation', 'education', 'motivation', 'nutrition', 'exercise', 'self-care', 'music', 'affirmation', 'empowerment', 'other'],
      default: 'other',
    },
    duration: {
      type: String,
      default: '', // e.g., "10 min"
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ Auto-extract YouTube video ID and thumbnail before saving
wellnessSchema.pre('save', function (next) {
  if (this.type === 'video' && this.url) {
    // Extract YouTube video ID from URL
    const match = this.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (match && match[1]) {
      this.videoId = match[1];
      // Auto-generate YouTube thumbnail if none provided
      if (!this.thumbnail) {
        this.thumbnail = `https://img.youtube.com/vi/${this.videoId}/hqdefault.jpg`;
      }
    }
  } else if (this.type === 'image' && !this.thumbnail) {
    // For images, thumbnail is the image itself
    this.thumbnail = this.url;
  }
  next();
});

const Wellness = mongoose.model('Wellness', wellnessSchema);
module.exports = Wellness;