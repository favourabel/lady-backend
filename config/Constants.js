// ============================================
// App-wide Constants
// ============================================
module.exports = {
  USER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
  },

  USER_ROLES: {
    USER: 'user',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin',
  },

  ADMIN_ROLES: {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
  },

  TIP_TYPES: {
    HEALTH: 'health',
    HYGIENE: 'hygiene',
    SPIRITUAL: 'spiritual',
  },

  NOTIFICATION_TYPES: {
    PERIOD: 'period',
    HEALTH: 'health',
    HYGIENE: 'hygiene',
    FERTILITY: 'fertility',
    REMINDER: 'reminder',
    GENERAL: 'general',
  },

  CHAT_SENDERS: {
    USER: 'user',
    ADMIN: 'admin',
    BOT: 'bot',
  },

  CYCLE_PHASES: {
    MENSTRUATION: 'menstruation',
    FOLLICULAR: 'follicular',
    OVULATION: 'ovulation',
    LUTEAL: 'luteal',
  },

  MOOD_OPTIONS: [
    'happy',
    'sad',
    'anxious',
    'energetic',
    'tired',
    'irritable',
    'calm',
    'emotional',
    'neutral',
  ],

  HEALTH_CONDITIONS: [
    'cramps',
    'bloating',
    'headache',
    'backache',
    'breast-tenderness',
    'acne',
    'fatigue',
    'nausea',
    'mood-swings',
    'insomnia',
    'food-cravings',
    'diarrhea',
    'constipation',
    'dizziness',
    'none',
  ],
};