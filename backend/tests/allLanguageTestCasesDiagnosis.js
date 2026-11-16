import { connectDB } from '../src/config/db.js';
import { handleIncomingMessage } from '../src/engine/deterministicCounsellingEngine.js';
import { extractIntentAndEntities, detectLanguageAndScript } from '../src/engine/languageDetectorService.js';
import mongoose from 'mongoose';

async function runAllTestCasesDiagnosis() {
  await connectDB();

  console.log('\n========================================================================');
  console.log('  ADMINATOR — FULL MULTILINGUAL TEST CASES DIAGNOSIS MATRIX');
  console.log('========================================================================\n');

  // Case 1: English request -> English response
  console.log('--- TEST CASE 1: English Request ---');
  const sid1 = 'tc-1-' + Date.now();
  const res1 = await handleIncomingMessage({
    sessionId: sid1,
    message: 'What branches are available in diploma engineering?',
    selectedLanguage: 'en'
  });
  console.log('Input       : "What branches are available in diploma engineering?"');
  console.log('Language    :', res1.language, res1.language === 'en' ? '✅ PASS' : '❌ FAIL');
  console.log('Reply Excerpt:', res1.reply.substring(0, 70).replace(/\n/g, ' '));

  // Case 2: Hindi language-switch request -> Hindi response
  console.log('\n--- TEST CASE 2: Hindi Language-Switch Request ---');
  const sid2 = 'tc-2-' + Date.now();
  // Simulating user starting in English and typing Hindi switch in chat
  await handleIncomingMessage({ sessionId: sid2, message: 'Hello', selectedLanguage: 'en' });
  const res2 = await handleIncomingMessage({
    sessionId: sid2,
    message: 'मैं हिन्दी में बात करना चाहता हूँ',
    selectedLanguage: 'en' // Current frontend sends currentLanguage (en)
  });
  console.log('Input       : "मैं हिन्दी में बात करना चाहता हूँ" (with selectedLanguage: en)');
  console.log('Language    :', res2.language, res2.language === 'hi' ? '✅ PASS' : '❌ FAIL (Returned en)');
  console.log('Reply Excerpt:', res2.reply.substring(0, 70).replace(/\n/g, ' '));

  // Case 3: Odia language-switch request -> Odia response
  console.log('\n--- TEST CASE 3: Odia Language-Switch Request ---');
  const sid3 = 'tc-3-' + Date.now();
  // Simulating user having session in Hindi then switching to Odia
  await handleIncomingMessage({ sessionId: sid3, message: 'नमस्ते', selectedLanguage: 'hi' });
  const res3 = await handleIncomingMessage({
    sessionId: sid3,
    message: 'ମୁଁ ଓଡ଼ିଆରେ କଥା ହେବାକୁ ଚାହୁଁଛି',
    selectedLanguage: 'hi' // Stale state from Hindi turn
  });
  console.log('Input       : "ମୁଁ ଓଡ଼ିଆରେ କଥା ହେବାକୁ ଚାହୁଁଛି" (with selectedLanguage: hi)');
  console.log('Language    :', res3.language, res3.language === 'or' ? '✅ PASS' : '❌ FAIL (Returned hi)');
  console.log('Reply Excerpt:', res3.reply.substring(0, 70).replace(/\n/g, ' '));

  // Case 4: English -> Hindi -> Odia -> English in one session
  console.log('\n--- TEST CASE 4: English -> Hindi -> Odia -> English in One Session ---');
  const sid4 = 'tc-4-' + Date.now();
  const r4_1 = await handleIncomingMessage({ sessionId: sid4, message: 'Hello', selectedLanguage: 'en' });
  const r4_2 = await handleIncomingMessage({ sessionId: sid4, message: 'मुझे मैकेनिकल की फीस जाननी है', selectedLanguage: 'en' });
  const r4_3 = await handleIncomingMessage({ sessionId: sid4, message: 'ମୋର ୬୦% ଅଛି ମେକାନିକାଲ୍ ମିଳିବ କି?', selectedLanguage: 'en' });
  const r4_4 = await handleIncomingMessage({ sessionId: sid4, message: 'Can I get hostel accommodation?', selectedLanguage: 'en' });
  console.log('Turn 1 (EN): returned lang =', r4_1.language, r4_1.language === 'en' ? '✅' : '❌');
  console.log('Turn 2 (HI): returned lang =', r4_2.language, r4_2.language === 'hi' ? '✅' : '❌ FAIL (returned en)');
  console.log('Turn 3 (OR): returned lang =', r4_3.language, r4_3.language === 'or' ? '✅' : '❌ FAIL (returned en)');
  console.log('Turn 4 (EN): returned lang =', r4_4.language, r4_4.language === 'en' ? '✅' : '❌');

  // Case 5: Romanized Hindi request
  console.log('\n--- TEST CASE 5: Romanized Hindi Request ---');
  const sid5 = 'tc-5-' + Date.now();
  const res5 = await handleIncomingMessage({
    sessionId: sid5,
    message: 'mujhe mechanical engineering me admission chahiye fees kitna lagega',
    selectedLanguage: 'en'
  });
  console.log('Input       : "mujhe mechanical engineering me admission chahiye fees kitna lagega"');
  console.log('Language    :', res5.language, res5.language === 'hi' ? '✅ PASS' : '❌ FAIL (Returned en)');

  // Case 6: Romanized Odia request
  console.log('\n--- TEST CASE 6: Romanized Odia Request ---');
  const sid6 = 'tc-6-' + Date.now();
  const res6 = await handleIncomingMessage({
    sessionId: sid6,
    message: 'mote civil engineering re admission miliba ki mora 58% mark achi',
    selectedLanguage: 'en'
  });
  console.log('Input       : "mote civil engineering re admission miliba ki mora 58% mark achi"');
  console.log('Language    :', res6.language, res6.language === 'or' ? '✅ PASS' : '❌ FAIL (Returned en)');

  // Case 7: Hindi-English mixed input
  console.log('\n--- TEST CASE 7: Hindi-English Mixed Input ---');
  const sid7 = 'tc-7-' + Date.now();
  const res7 = await handleIncomingMessage({
    sessionId: sid7,
    message: 'CSE branch me placement kaisa hai aur teachers kaise hain?',
    selectedLanguage: 'en'
  });
  console.log('Input       : "CSE branch me placement kaisa hai aur teachers kaise hain?"');
  console.log('Language    :', res7.language, res7.language === 'hi' ? '✅ PASS' : '❌ FAIL (Returned en)');

  // Case 8: Odia-English mixed input
  console.log('\n--- TEST CASE 8: Odia-English Mixed Input ---');
  const sid8 = 'tc-8-' + Date.now();
  const res8 = await handleIncomingMessage({
    sessionId: sid8,
    message: 'Electrical branch re lab facility kenta achi kete fee lagiba?',
    selectedLanguage: 'en'
  });
  console.log('Input       : "Electrical branch re lab facility kenta achi kete fee lagiba?"');
  console.log('Language    :', res8.language, res8.language === 'or' ? '✅ PASS' : '❌ FAIL (Returned en)');

  await mongoose.disconnect();
}

runAllTestCasesDiagnosis().catch((err) => {
  console.error(err);
  process.exit(1);
});
