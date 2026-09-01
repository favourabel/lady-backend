// ============================================
// Tips Routes (User-Facing)
// ============================================
const express = require('express');
const {
  getDailyHealthTip,
  getDailyHygieneTip,
  getDailyInspiration,
  getAllDailyTips,
  getAllHealthTips,
  getAllHygieneTips,
  getAllInspirations,
} = require('../controllers/tipsController');
const { protect } = require('../middleware/Auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all 3 daily tips at once (best for dashboard!)
router.get('/daily', getAllDailyTips);

// Daily tips (single)
router.get('/health/daily', getDailyHealthTip);
router.get('/hygiene/daily', getDailyHygieneTip);
router.get('/inspiration/daily', getDailyInspiration);

// List all active tips
router.get('/health', getAllHealthTips);
router.get('/hygiene', getAllHygieneTips);
router.get('/inspiration', getAllInspirations);

// ============================================
// AI-Generated Daily Dashboard Data
// ============================================
router.get('/daily-dashboard', async (req, res) => {
  // Default fallback data if Groq is slow, rate-limited, or unavailable
  const fallbackData = {
    metrics: {
      waterIntake: 6,
      sleepHours: 7.5,
      exerciseMinutes: 30,
      calories: 1850
    },
    activities: [
      { name: "Morning Vitamins", time: "8:00 AM", completed: true },
      { name: "Drink Water", time: "10:00 AM", completed: true },
      { name: "Healthy Lunch", time: "12:30 PM", completed: false },
      { name: "Evening Workout", time: "6:00 PM", completed: false }
    ],
    healthTip: "Stay hydrated and listen to your body today."
  };

  try {
    if (!process.env.GROQ_API_KEY) {
      return res.json({ success: true, data: fallbackData });
    }

    const prompt = `Generate realistic daily health data for a woman tracking her menstrual health. Return ONLY valid JSON in this exact format (no extra text, no markdown):
{
  "metrics": {
    "waterIntake": 6,
    "sleepHours": 7.5,
    "exerciseMinutes": 30,
    "calories": 1850
  },
  "activities": [
    {"name": "Morning Vitamins", "time": "8:00 AM", "completed": true},
    {"name": "Drink Water", "time": "10:00 AM", "completed": true},
    {"name": "Healthy Lunch", "time": "12:30 PM", "completed": false},
    {"name": "Evening Workout", "time": "6:00 PM", "completed": false}
  ],
  "healthTip": "Stay hydrated and listen to your body today."
}

Vary the numbers realistically (water 4-8, sleep 6-9, exercise 20-60, calories 1600-2200) and change the activities and tip each time.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.choices || !data.choices[0]) {
      console.warn('⚠️ Groq returned fallback for dashboard:', data.error?.message || 'No choices');
      return res.json({ success: true, data: fallbackData });
    }

    const aiContent = data.choices[0].message.content.trim();
    const cleanedContent = aiContent.replace(/```json|```/g, '').trim();
    const dashboardData = JSON.parse(cleanedContent);

    return res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('AI Dashboard Non-fatal Error:', error.message);
    // Graceful fallback prevents 500 error on frontend
    return res.json({ success: true, data: fallbackData });
  }
});

module.exports = router;