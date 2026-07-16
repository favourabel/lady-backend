// ============================================
// Cycle Model (menstrual cycle logs)
// ============================================
const mongoose = require('mongoose');
const {
  MOOD_OPTIONS,
  HEALTH_CONDITIONS,
  CYCLE_PHASES,
} = require('../config/Constants');

const cycleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      default: null,
    },
    cycleLength: {
      type: Number,
      default: 28,
      min: [15, 'Cycle length must be at least 15 days'],
      max: [60, 'Cycle length cannot exceed 60 days'],
    },
    periodDuration: {
      type: Number,
      default: 5,
      min: [2, 'Period duration must be at least 2 days'],
      max: [10, 'Period duration cannot exceed 10 days'],
    },
    flowIntensity: {
      type: String,
      enum: ['light', 'moderate', 'heavy'],
      default: 'moderate',
    },
    mood: {
      type: String,
      enum: MOOD_OPTIONS,
      default: 'neutral',
    },
    symptoms: [
      {
        type: String,
        enum: HEALTH_CONDITIONS,
      },
    ],
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    temperature: {
      type: Number,
      min: [35, 'Temperature must be at least 35°C'],
      max: [42, 'Temperature cannot exceed 42°C'],
      default: null,
    },
    cervicalMucus: {
      type: String,
      enum: ['dry', 'sticky', 'creamy', 'watery'],
      default: null,
    },
    sexualActivity: {
      type: Boolean,
      default: false,
    },
    contraceptionUsed: {
      type: String,
      default: null,
    },
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    isCompleted: {
      type: Boolean,
      default: false,
    },
    phase: {
      type: String,
      enum: Object.values(CYCLE_PHASES),
      default: CYCLE_PHASES.MENSTRUATION,
    },
  },
  { timestamps: true }
);

// Indexes
cycleSchema.index({ userId: 1, startDate: -1 });
cycleSchema.index({ userId: 1, endDate: -1 });

// Auto-calculate cycle phase from startDate + today
cycleSchema.pre('save', function (next) {
  if (this.startDate && this.cycleLength) {
    const today = new Date();
    const startDate = new Date(this.startDate);
    const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

    if (daysSinceStart < 0) {
      // future start date — default to menstruation
      this.phase = CYCLE_PHASES.MENSTRUATION;
    } else if (daysSinceStart < this.periodDuration) {
      this.phase = CYCLE_PHASES.MENSTRUATION;
    } else if (daysSinceStart < Math.floor(this.cycleLength * 0.35)) {
      this.phase = CYCLE_PHASES.FOLLICULAR;
    } else if (daysSinceStart < Math.floor(this.cycleLength * 0.5)) {
      this.phase = CYCLE_PHASES.OVULATION;
    } else {
      this.phase = CYCLE_PHASES.LUTEAL;
    }
  }
  next();
});

const Cycle = mongoose.model('Cycle', cycleSchema);
module.exports = Cycle;