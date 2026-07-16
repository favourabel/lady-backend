// ============================================
// Profile Model (Extended user health data)
// ============================================
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    height: {
      type: Number,
      default: null,
      min: [100, 'Height must be at least 100cm'],
      max: [250, 'Height cannot exceed 250cm'],
    },
    weight: {
      type: Number,
      default: null,
      min: [30, 'Weight must be at least 30kg'],
      max: [300, 'Weight cannot exceed 300kg'],
    },
    bmi: {
      type: Number,
      default: null,
    },
    bloodType: {
      type: String,
      enum: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
      default: null,
    },
    medicalConditions: [
      {
        type: String,
        enum: [
          'PCOS',
          'Endometriosis',
          'Fibroids',
          'Irregular cycles',
          'Amenorrhea',
          'Dysmenorrhea',
          'PMS',
          'None',
        ],
      },
    ],
    medications: [
      {
        name: String,
        dosage: String,
        frequency: String,
        reason: String,
        startDate: Date,
      },
    ],
    allergies: [String],
    medicalNotes: {
      type: String,
      maxlength: [1000, 'Medical notes cannot exceed 1000 characters'],
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    healthGoals: [String],
    fitnessLevel: {
      type: String,
      enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active'],
      default: 'moderately_active',
    },
    sleepAveragePerNight: {
      type: Number,
      min: 0,
      max: 24,
      default: 7,
    },
    stressLevel: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      default: 'moderate',
    },
    privacySettings: {
      shareAnalytics: { type: Boolean, default: false },
      allowResearch: { type: Boolean, default: false },
      profileVisibility: {
        type: String,
        enum: ['private', 'friends', 'public'],
        default: 'private',
      },
    },
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      periodReminder: { type: Boolean, default: true },
      ovulationReminder: { type: Boolean, default: true },
      healthTips: { type: Boolean, default: true },
      hygieneTips: { type: Boolean, default: true },
      inspirationalMessages: { type: Boolean, default: false },
      pushNotifications: { type: Boolean, default: false },
    },
    themePreference: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light',
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);



// Auto-calculate BMI before saving
profileSchema.pre('save', function (next) {
  if (this.height && this.weight) {
    const heightInMeters = this.height / 100;
    this.bmi = parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
  }
  next();
});

// Calculate profile completion percentage
profileSchema.methods.calculateCompletion = function () {
  const fields = [
    'height',
    'weight',
    'bloodType',
    'medicalConditions',
    'medications',
    'allergies',
    'emergencyContact',
  ];

  const filledFields = fields.filter((field) => {
    const value = this[field];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
    return value !== null && value !== undefined && value !== '';
  }).length;

  this.completionPercentage = Math.round((filledFields / fields.length) * 100);
  return this.completionPercentage;
};

const Profile = mongoose.model('Profile', profileSchema);
module.exports = Profile;