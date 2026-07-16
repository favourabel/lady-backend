// ============================================
// services/cycleCalculatorService.js
// Menstrual cycle calculation and prediction algorithms
// ============================================

const dayjs = require('dayjs');

/**
 * Calculate all cycle predictions from a start date
 */
const calculateCyclePredictions = (startDate, cycleLength = 28, periodDuration = 5) => {
  const start = dayjs(startDate);

  const periodEnd = start.add(periodDuration - 1, 'day');
  const nextPeriodStart = start.add(cycleLength, 'day');
  const ovulationDate = nextPeriodStart.subtract(14, 'day');
  const fertileWindowStart = ovulationDate.subtract(5, 'day');
  const fertileWindowEnd = ovulationDate.add(1, 'day');

  const follicularStart = periodEnd.add(1, 'day');
  const follicularEnd = fertileWindowStart.subtract(1, 'day');
  const lutealStart = ovulationDate.add(2, 'day');
  const lutealEnd = nextPeriodStart.subtract(1, 'day');

  const safeBeforeFertile = {
    start: start.toDate(),
    end: fertileWindowStart.subtract(1, 'day').toDate(),
  };

  const safeAfterFertile = {
    start: fertileWindowEnd.add(1, 'day').toDate(),
    end: lutealEnd.toDate(),
  };

  return {
    // Core dates
    startDate: start.toDate(),
    periodEndDate: periodEnd.toDate(),
    nextPeriodStart: nextPeriodStart.toDate(),
    ovulationDate: ovulationDate.toDate(),
    fertileWindowStart: fertileWindowStart.toDate(),
    fertileWindowEnd: fertileWindowEnd.toDate(),

    // Phases
    phases: {
      menstrual: {
        name: 'Menstrual Phase',
        start: start.toDate(),
        end: periodEnd.toDate(),
        color: '#EC4899',
        description: 'Your period is here. Rest, stay hydrated, and be gentle with yourself.',
        tips: [
          'Use heat therapy for cramps',
          'Eat iron-rich foods to replenish lost iron',
          'Stay well hydrated',
          'Light exercise like yoga can help',
        ],
      },
      follicular: {
        name: 'Follicular Phase',
        start: follicularStart.toDate(),
        end: follicularEnd.toDate(),
        color: '#8B5CF6',
        description: 'Your energy is rising. Great time for new projects and social activities.',
        tips: [
          'Great time for high-intensity workouts',
          'Eat lean proteins and fiber',
          'Start new projects or challenges',
        ],
      },
      ovulatory: {
        name: 'Ovulatory Phase',
        start: fertileWindowStart.toDate(),
        end: fertileWindowEnd.toDate(),
        color: '#F59E0B',
        description: 'Peak fertility and energy.',
        tips: [
          'Eat antioxidant-rich foods',
          'Great time for social events',
          'Stay hydrated',
        ],
      },
      luteal: {
        name: 'Luteal Phase',
        start: lutealStart.toDate(),
        end: lutealEnd.toDate(),
        color: '#3B82F6',
        description: 'Slow down and prepare. Focus on self-care and rest.',
        tips: [
          'Reduce caffeine and alcohol',
          'Eat complex carbohydrates',
          'Practice gentle yoga',
          'Prioritize sleep',
        ],
      },
    },

    safePeriods: [safeBeforeFertile, safeAfterFertile],

    daysUntilNextPeriod: nextPeriodStart.diff(dayjs(), 'day'),
    daysUntilOvulation: ovulationDate.diff(dayjs(), 'day'),
    currentCycleDay: dayjs().diff(start, 'day') + 1,
    currentPhase: getCurrentPhase(dayjs().toDate(), {
      periodEnd: periodEnd.toDate(),
      follicularEnd: follicularEnd.toDate(),
      fertileWindowEnd: fertileWindowEnd.toDate(),
      nextPeriodStart: nextPeriodStart.toDate(),
    }),
  };
};

/**
 * Determine current cycle phase
 */
const getCurrentPhase = (today, phaseDates) => {
  const now = dayjs(today);

  if (now.isBefore(dayjs(phaseDates.periodEnd)) || now.isSame(dayjs(phaseDates.periodEnd), 'day')) {
    return 'menstrual';
  }
  if (now.isBefore(dayjs(phaseDates.follicularEnd)) || now.isSame(dayjs(phaseDates.follicularEnd), 'day')) {
    return 'follicular';
  }
  if (now.isBefore(dayjs(phaseDates.fertileWindowEnd)) || now.isSame(dayjs(phaseDates.fertileWindowEnd), 'day')) {
    return 'ovulatory';
  }
  return 'luteal';
};

/**
 * Generate multiple future cycle predictions
 */
const generateFuturePredictions = (lastPeriodStart, cycleLength = 28, periodDuration = 5, monthsAhead = 3) => {
  const predictions = [];
  let currentStart = dayjs(lastPeriodStart);
  const endDate = dayjs().add(monthsAhead, 'month');

  while (currentStart.isBefore(endDate)) {
    const prediction = calculateCyclePredictions(currentStart.toDate(), cycleLength, periodDuration);
    predictions.push(prediction);
    currentStart = dayjs(prediction.nextPeriodStart);
  }

  return predictions;
};

/**
 * Calculate average cycle length from history
 */
const calculateAverageCycleLength = (cycles) => {
  if (!cycles || cycles.length === 0) return 28;

  const completedCycles = cycles.filter((c) => c.endDate);
  if (completedCycles.length === 0) return 28;

  const lengths = completedCycles.map((cycle) => {
    const start = dayjs(cycle.startDate);
    const end = dayjs(cycle.endDate);
    return end.diff(start, 'day');
  });

  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  return Math.max(21, Math.min(45, Math.round(avg)));
};

/**
 * Get calendar day type for UI coloring
 */
const getCalendarDayType = (date, cyclePredictions) => {
  const d = dayjs(date);
  if (!cyclePredictions) return 'normal';

  const {
    startDate,
    periodEndDate,
    fertileWindowStart,
    fertileWindowEnd,
    ovulationDate,
    nextPeriodStart,
  } = cyclePredictions;

  if (
    d.isSame(dayjs(startDate), 'day') ||
    (d.isAfter(dayjs(startDate).subtract(1, 'day')) &&
      d.isBefore(dayjs(periodEndDate).add(1, 'day')))
  ) {
    return 'period';
  }

  if (d.isSame(dayjs(ovulationDate), 'day')) return 'ovulation';

  if (
    d.isAfter(dayjs(fertileWindowStart).subtract(1, 'day')) &&
    d.isBefore(dayjs(fertileWindowEnd).add(1, 'day'))
  ) {
    return 'fertile';
  }

  if (d.isSame(dayjs(nextPeriodStart), 'day')) return 'predicted_period';

  return 'normal';
};

module.exports = {
  calculateCyclePredictions,
  getCurrentPhase,
  generateFuturePredictions,
  calculateAverageCycleLength,
  getCalendarDayType,
};