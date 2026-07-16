// ============================================
// Analytics Model (per-user statistics)
// ============================================
const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    totalCycles: {
      type: Number,
      default: 0,
    },
    averageCycleLength: {
      type: Number,
      default: 28,
    },
    averagePeriodDuration: {
      type: Number,
      default: 5,
    },
    lastCycleDate: {
      type: Date,
      default: null,
    },
    predictedNextCycleDate: {
      type: Date,
      default: null,
    },
    moodData: {
      happy: { type: Number, default: 0 },
      sad: { type: Number, default: 0 },
      anxious: { type: Number, default: 0 },
      energetic: { type: Number, default: 0 },
      tired: { type: Number, default: 0 },
      irritable: { type: Number, default: 0 },
      calm: { type: Number, default: 0 },
      emotional: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 },
    },
    symptomFrequency: {
      cramps: { type: Number, default: 0 },
      bloating: { type: Number, default: 0 },
      headache: { type: Number, default: 0 },
      backache: { type: Number, default: 0 },
      breastTenderness: { type: Number, default: 0 },
      acne: { type: Number, default: 0 },
      fatigue: { type: Number, default: 0 },
      nausea: { type: Number, default: 0 },
      moodSwings: { type: Number, default: 0 },
      insomnia: { type: Number, default: 0 },
    },
    flowIntensityData: {
      light: { type: Number, default: 0 },
      moderate: { type: Number, default: 0 },
      heavy: { type: Number, default: 0 },
    },
    appUsageStats: {
      totalLogins: { type: Number, default: 0 },
      lastLogin: { type: Date, default: null },
      averageMonthlyLogins: { type: Number, default: 0 },
      totalTimeSpent: { type: Number, default: 0 }, // minutes
    },
    cycleAccuracy: {
      correctPredictions: { type: Number, default: 0 },
      totalPredictions: { type: Number, default: 0 },
      accuracyPercentage: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);


// Update accuracy percentage
analyticsSchema.methods.updateAccuracy = function () {
  if (this.cycleAccuracy.totalPredictions > 0) {
    this.cycleAccuracy.accuracyPercentage = Math.round(
      (this.cycleAccuracy.correctPredictions / this.cycleAccuracy.totalPredictions) * 100
    );
  }
  return this.save();
};

const Analytics = mongoose.model('Analytics', analyticsSchema);
module.exports = Analytics;