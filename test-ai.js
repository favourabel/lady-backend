// test-ai.js
require('dotenv').config();
const { getAIResponse } = require('./services/aiService');

async function testAI() {
  console.log('\n🧪 Testing MyLady AI Service...\n');
  console.log('═══════════════════════════════════════\n');
  
  // Test 1: FAQ instant response
  try {
    console.log('📝 Test 1: Common FAQ (should be INSTANT)');
    console.log('Question: "What helps with period cramps?"');
    const start1 = Date.now();
    const r1 = await getAIResponse('What helps with period cramps?');
    console.log(`⏱️  Time: ${Date.now() - start1}ms`);
    console.log(`✅ Response: ${r1}\n`);
  } catch (err) {
    console.log(`❌ Test 1 Failed: ${err.message}\n`);
  }
  
  // Test 2: AI response
  try {
    console.log('📝 Test 2: Complex question (Groq AI)');
    console.log('Question: "Can I swim during my period?"');
    const start2 = Date.now();
    const r2 = await getAIResponse('Can I swim during my period?');
    console.log(`⏱️  Time: ${Date.now() - start2}ms`);
    console.log(`✅ Response: ${r2}\n`);
  } catch (err) {
    console.log(`❌ Test 2 Failed: ${err.message}\n`);
  }
  
  // Test 3: Off-topic
  try {
    console.log('📝 Test 3: Off-topic question');
    console.log('Question: "What is the weather today?"');
    const start3 = Date.now();
    const r3 = await getAIResponse('What is the weather today?');
    console.log(`⏱️  Time: ${Date.now() - start3}ms`);
    console.log(`✅ Response: ${r3}\n`);
  } catch (err) {
    console.log(`❌ Test 3 Failed: ${err.message}\n`);
  }
  
  // Test 4: Greeting
  try {
    console.log('📝 Test 4: Greeting (FAQ)');
    console.log('Question: "Hello"');
    const start4 = Date.now();
    const r4 = await getAIResponse('Hello');
    console.log(`⏱️  Time: ${Date.now() - start4}ms`);
    console.log(`✅ Response: ${r4}\n`);
  } catch (err) {
    console.log(`❌ Test 4 Failed: ${err.message}\n`);
  }
  
  console.log('═══════════════════════════════════════');
  console.log('✨ All tests completed!\n');
  process.exit(0);
}

testAI();