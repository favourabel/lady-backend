// services/aiService.js
const Groq = require('groq-sdk');
const logger = require('../utils/logger');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// ============================================
// Quick FAQ (INSTANT responses - no AI call)
// ============================================
const FAQs = [
  {
    keywords: ['cramp', 'pain', 'painful', 'hurt'],
    answer: 'For period cramps, try a heat pad on your lower belly, gentle stretching, and drinking warm water. If pain is severe, please see a doctor. 💕'
  },
  {
    keywords: ['how long', 'duration', 'many days'],
    answer: 'A normal period lasts 3-7 days. If yours is longer than 7 days, please consult a doctor. 🌸'
  },
  {
    keywords: ['late', 'missed', 'delay', 'not come'],
    answer: 'Periods can be late due to stress, diet changes, or hormones. If missed for 2+ months, please see a doctor. 💕'
  },
  {
    keywords: ['pms', 'mood swing', 'emotional', 'irritable'],
    answer: 'PMS causes mood changes, bloating, and irritability before your period. Rest, exercise, and healthy food help! 🌸'
  },
  {
    keywords: ['pad', 'tampon', 'change', 'hygiene'],
    answer: 'Change pads every 4-6 hours and tampons every 4-8 hours. Always wash hands before and after! ✨'
  },
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon'],
    answer: 'Hello lovely! 🌸 I\'m MyLady AI. Ask me anything about your menstrual health, and I\'ll do my best to help! 💕'
  },
  {
    keywords: ['thank', 'thanks'],
    answer: 'You\'re very welcome! 💕 I\'m always here to help. Take care of yourself! 🌸'
  }
];

// ============================================
// AI System Prompt (Personality & Rules)
// ============================================
const SYSTEM_PROMPT = `You are "MyLady AI" - a warm, kind women's health assistant 
specializing in menstrual health.

RULES:
1. ONLY answer questions about: periods, menstrual cycles, PMS, cramps, PCOS, 
   hygiene, menopause, fertility basics, and women's wellness.
2. Keep responses SHORT (2-3 sentences maximum).
3. Be warm and use simple language.
4. If symptoms sound serious (heavy bleeding 7+ days, fainting, severe pain), 
   say: "Please see a doctor immediately."
5. Never prescribe medicines.
6. If question is unrelated to women's health, say: "I can only help with 
   menstrual health questions. Our admin will reply to you soon. 💕"
7. Use emojis occasionally (🌸💕✨).`;

// ============================================
// Main AI Response Function
// ============================================
async function getAIResponse(userMessage, chatHistory = []) {
  const lower = userMessage.toLowerCase().trim();
  
  // 1️⃣ Check FAQ first (INSTANT response)
  for (const faq of FAQs) {
    if (faq.keywords.some(keyword => lower.includes(keyword))) {
      logger.info('⚡ FAQ instant response used');
      return faq.answer;
    }
  }
  
  // 2️⃣ Use Groq AI for complex questions
  try {
    logger.info('🤖 Calling Groq AI...');
    const startTime = Date.now();
    
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      // Include last 4 messages for context
      ...chatHistory.slice(-4).map(msg => ({
        role: msg.senderType === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    const response = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.1-8b-instant',
      max_tokens: 200,
      temperature: 0.7
    });
    
    const responseTime = Date.now() - startTime;
    logger.info(`✅ AI responded in ${responseTime}ms`);
    
    return response.choices[0].message.content;
    
  } catch (error) {
    logger.error(`❌ AI Error: ${error.message}`);
    return "I'm having a moment 💕 Our admin will reply to you shortly!";
  }
}

// ============================================
// Check if AI service is available
// ============================================
function isAIAvailable() {
  return !!process.env.GROQ_API_KEY;
}

module.exports = { 
  getAIResponse,
  isAIAvailable
};