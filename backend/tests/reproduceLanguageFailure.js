import { connectDB } from '../src/config/db.js';
import { handleIncomingMessage } from '../src/engine/deterministicCounsellingEngine.js';
import { extractIntentAndEntities, detectLanguageAndScript } from '../src/engine/languageDetectorService.js';
import mongoose from 'mongoose';

async function runDiagnosis() {
  await connectDB();

  console.log('\n===============================================================');
  console.log('  ADMINATOR — MULTILINGUAL LANGUAGE SWITCH FAILURE DIAGNOSIS');
  console.log('===============================================================\n');

  const sid = 'sim-repro-' + Date.now();

  // Initial greeting
  await handleIncomingMessage({
    sessionId: sid,
    message: 'Hello',
    selectedLanguage: 'en',
    collegeCode: 'KIPT'
  });

  // TEST 1: User sends "मैं हिन्दी में बात करना चाहता हूँ" with selectedLanguage: 'en'
  console.log('--- FAILURE 1 REPRODUCTION ---');
  const t1 = await handleIncomingMessage({
    sessionId: sid,
    message: 'मैं हिन्दी में बात करना चाहता हूँ',
    selectedLanguage: 'en',
    collegeCode: 'KIPT'
  });

  console.log('User Input        : "मैं हिन्दी में बात करना चाहता हूँ"');
  console.log('selectedLanguage   :', 'en');
  console.log('Expected Language  : hi');
  console.log('Actual Language    :', t1.language);
  console.log('Actual Reply Excerpt:', t1.reply.substring(0, 90).replace(/\n/g, ' '));
  console.log('Failure 1 Match    :', t1.language === 'en' ? 'REPRODUCED (Bug Confirmed)' : 'NOT REPRODUCED');

  // TEST 2: User sends "ମୁଁ ଓଡ଼ିଆରେ କଥା ହେବାକୁ ଚାହୁଁଛି" with selectedLanguage: 'hi'
  console.log('\n--- FAILURE 2 REPRODUCTION ---');
  const t2 = await handleIncomingMessage({
    sessionId: sid,
    message: 'ମୁଁ ଓଡ଼ିଆରେ କଥା ହେବାକୁ ଚାହୁଁଛି',
    selectedLanguage: 'hi',
    collegeCode: 'KIPT'
  });

  console.log('User Input        : "ମୁଁ ଓଡ଼ିଆରେ କଥା ହେବାକୁ ଚାହୁଁଛି"');
  console.log('selectedLanguage   :', 'hi');
  console.log('Expected Language  : or');
  console.log('Actual Language    :', t2.language);
  console.log('Actual Reply Excerpt:', t2.reply.substring(0, 90).replace(/\n/g, ' '));
  console.log('Failure 2 Match    :', t2.language === 'hi' ? 'REPRODUCED (Bug Confirmed)' : 'NOT REPRODUCED');

  // TEST 3: NLU Intent for language switch expressions
  console.log('\n--- INTENT RECOGNITION FOR LANGUAGE SWITCH PHRASES ---');
  const switchPhrases = [
    'मैं हिन्दी में बात करना चाहता हूँ',
    'ମୁଁ ଓଡ଼ିଆରେ କଥା ହେବାକୁ ଚାହୁଁଛି',
    'Switch to Hindi please',
    'Switch to Odia please',
    'Switch to English',
    'hindi me baat karo',
    'odia re katha hebi'
  ];

  for (const p of switchPhrases) {
    const nlu = extractIntentAndEntities(p, 'en');
    console.log(`Phrase: "${p}"`);
    console.log(`  -> Detected Lang: ${nlu.language}, Script: ${nlu.script}, Intent: ${nlu.intent}`);
  }

  // TEST 4: Quick-reply buttons active language alignment
  console.log('\n--- QUICK REPLIES ACTIVE LANGUAGE ALIGNMENT ---');
  console.log('t1 (intended Hindi, actual English) quickReplies:', t1.quickReplies);
  console.log('t2 (intended Odia, actual Hindi) quickReplies:', t2.quickReplies);

  await mongoose.disconnect();
}

runDiagnosis().catch((err) => {
  console.error('Diagnosis failed:', err);
  process.exit(1);
});
