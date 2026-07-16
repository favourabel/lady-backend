// ============================================
// General Helper Utilities
// ============================================
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// ============================================
// Cycle Calculation Helpers
// ============================================
const calculateCyclePhase = (cycleStartDate, cycleLength, phaseOfDay) => {
  const daysSinceStart = dayjs(phaseOfDay).diff(dayjs(cycleStartDate), 'day');

  if (daysSinceStart < 0) return null;

  const follicularPhaseEnd = Math.floor(cycleLength * 0.35);
  const ovulationPhaseEnd = Math.floor(cycleLength * 0.5);
  const lutealPhaseEnd = cycleLength;

  if (daysSinceStart < follicularPhaseEnd) return 'follicular';
  if (daysSinceStart < ovulationPhaseEnd) return 'ovulation';
  if (daysSinceStart <= lutealPhaseEnd) return 'luteal';

  return 'menstruation';
};

const predictNextPeriod = (lastPeriodStart, cycleLength) => {
  return dayjs(lastPeriodStart).add(cycleLength, 'day').toDate();
};

const predictOvulation = (lastPeriodStart, cycleLength) => {
  const ovulationDay = Math.floor(cycleLength / 2);
  return dayjs(lastPeriodStart).add(ovulationDay, 'day').toDate();
};

const predictFertileWindow = (lastPeriodStart, cycleLength) => {
  const ovulation = predictOvulation(lastPeriodStart, cycleLength);
  const start = dayjs(ovulation).subtract(5, 'day').toDate();
  const end = dayjs(ovulation).add(1, 'day').toDate();
  return { start, end, ovulation };
};

const isSafeDay = (date, lastPeriodStart, cycleLength) => {
  const nextPeriod = predictNextPeriod(lastPeriodStart, cycleLength);
  const daysUntilPeriod = dayjs(nextPeriod).diff(dayjs(date), 'day');
  return daysUntilPeriod > 7;
};

const getDayOfCycle = (lastPeriodStart, currentDate = new Date()) => {
  const start = dayjs(lastPeriodStart);
  const current = dayjs(currentDate);
  return current.diff(start, 'day') + 1;
};

// ============================================
// Date Helpers
// ============================================
const formatDate = (date, format = 'YYYY-MM-DD') => {
  return dayjs(date).format(format);
};

const getTimeZoneDate = (date, tz) => {
  return dayjs(date).tz(tz);
};

const calculateDaysBetween = (startDate, endDate) => {
  return dayjs(endDate).diff(dayjs(startDate), 'day');
};

const isToday = (date) => dayjs(date).isSame(dayjs(), 'day');
const isFuture = (date) => dayjs(date).isAfter(dayjs());
const isPast = (date) => dayjs(date).isBefore(dayjs());

const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month] || '';
};

// ============================================
// Validation Helpers
// ============================================
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isStrongPassword = (password) => {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongRegex.test(password);
};

// ============================================
// Security & Utility Helpers
// ============================================
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sanitizeUserInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  return input;
};

const slugify = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
};

const capitalizeWords = (text) => {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
};

// ============================================
// Pagination Helpers
// ============================================
const paginate = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, skip };
};

const generatePaginationMeta = (page, limit, total) => {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    hasMore: page < Math.ceil(total / limit),
  };
};

// ============================================
// Export All
// ============================================
module.exports = {
  // Cycle helpers
  calculateCyclePhase,
  predictNextPeriod,
  predictOvulation,
  predictFertileWindow,
  isSafeDay,
  getDayOfCycle,
  // Date helpers
  formatDate,
  getTimeZoneDate,
  calculateDaysBetween,
  isToday,
  isFuture,
  isPast,
  getMonthName,
  // Validation
  isValidEmail,
  isStrongPassword,
  // Utility
  generateOTP,
  sanitizeUserInput,
  slugify,
  capitalizeWords,
  // Pagination
  paginate,
  generatePaginationMeta,
};