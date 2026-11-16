import assert from 'node:assert';
import {
  normalizeUnicode,
  detectLanguageAndScript,
  extractIntentAndEntities
} from '../src/engine/languageDetectorService.js';

console.log('--- ADMINATOR LANGUAGE INTELLIGENCE TEST SUITE ---');

// Test 1: Unicode Normalization
const testText = '  ନମସ୍କାର   ସାଙ୍ଗେ  ';
assert.strictEqual(normalizeUnicode(testText), 'ନମସ୍କାର ସାଙ୍ଗେ');
console.log('✅ 1. Unicode NFC Normalization passed');

// Test 2: Native Odia Script Detection
const odiaNative = 'ନମସ୍କାର, ମୋତେ ମେକାନିକାଲ ଇଞ୍ଜିନିୟରିଂ ଫିସ୍ ଜାଣିବାକୁ ଅଛି';
const odiaRes = detectLanguageAndScript(odiaNative);
assert.strictEqual(odiaRes.language, 'or');
assert.strictEqual(odiaRes.script, 'NATIVE_ODIA');
console.log('✅ 2. Native Odia script detection passed');

// Test 3: Native Hindi Script Detection
const hindiNative = 'नमस्ते, मुझे सिविल इंजीनियरिंग में एडमिशन लेना है';
const hindiRes = detectLanguageAndScript(hindiNative);
assert.strictEqual(hindiRes.language, 'hi');
assert.strictEqual(hindiRes.script, 'NATIVE_HINDI');
console.log('✅ 3. Native Hindi script detection passed');

// Test 4: Romanized Odia (Odlish)
const odlishText = 'mote mechanical re admission miliba ki 58% mark achi';
const odlishRes = extractIntentAndEntities(odlishText);
assert.strictEqual(odlishRes.language, 'or');
assert.strictEqual(odlishRes.script, 'ROMANIZED_ODIA');
assert.strictEqual(odlishRes.entities.branchCode, 'MECH');
assert.strictEqual(odlishRes.entities.percentage, 58);
assert.strictEqual(odlishRes.intent, 'ELIGIBILITY_CHECK');
console.log('✅ 4. Odlish romanized parsing and entity extraction passed');

// Test 5: Romanized Hindi (Hinglish)
const hinglishText = 'fees kitna lagega hostel ke sath computer science me';
const hinglishRes = extractIntentAndEntities(hinglishText);
assert.strictEqual(hinglishRes.language, 'hi');
assert.strictEqual(hinglishRes.script, 'ROMANIZED_HINDI');
assert.strictEqual(hinglishRes.entities.branchCode, 'CSE');
assert.strictEqual(hinglishRes.entities.includeHostel, true);
assert.strictEqual(hinglishRes.intent, 'FEE_AND_HOSTEL_QUERY');
console.log('✅ 5. Hinglish romanized fee & hostel query passed');

// Test 6: Code-Mixed Query
const codeMixedText = 'CSE branch re admission process kana achi?';
const codeMixedRes = extractIntentAndEntities(codeMixedText);
assert.strictEqual(codeMixedRes.language, 'or');
assert.strictEqual(codeMixedRes.isCodeMixed, true);
assert.strictEqual(codeMixedRes.entities.branchCode, 'CSE');
console.log('✅ 6. Code-mixed Odia-English query passed');

// Test 7: Typo-Tolerant Terminology
const typoText = 'mechnical fiss kitna hai hostel ke bina';
const typoRes = extractIntentAndEntities(typoText);
assert.strictEqual(typoRes.entities.branchCode, 'MECH');
assert.strictEqual(typoRes.intent, 'FEE_AND_HOSTEL_QUERY');
console.log('✅ 7. Typo-tolerant branch and fee terminology passed');

console.log('🎉 ALL LANGUAGE INTELLIGENCE TESTS PASSED CLEANLY (7/7)');
