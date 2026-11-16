import assert from 'node:assert';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { handleIncomingMessage } from '../src/engine/deterministicCounsellingEngine.js';
import { College, Branch, FeeStructure, Enquiry, Student } from '../src/models/index.js';
import { generateTrackingId } from '../src/utils/idGenerator.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/adminator_demo';

console.log('--- ADMINATOR COUNSELLING & ENQUIRY ENGINE INTEGRATION TEST ---');

async function runTests() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB for testing');

  // Test 1: Tracking ID format
  const trackingId = generateTrackingId();
  assert.match(trackingId, /^ADM-\d{8}-[A-F0-9]{4,8}$/);
  console.log(`✅ 1. Tracking ID generation: ${trackingId}`);

  // Test 2: Odia Greeting
  const sessionId = 'test-session-' + Date.now();
  const odiaGreeting = await handleIncomingMessage({
    sessionId,
    message: 'ନମସ୍କାର, ମୁଁ ଡିପ୍ଲୋମା ନାମଲେଖା ବିଷୟରେ ଜାଣିବାକୁ ଚାହୁଁଛି',
    selectedLanguage: 'or'
  });
  assert.strictEqual(odiaGreeting.language, 'or');
  assert.strictEqual(odiaGreeting.intent, 'GREETING');
  assert.ok(odiaGreeting.reply.includes('ଆଡମିନିଏଟର'));
  assert.ok(odiaGreeting.reply.includes('[ଡେମୋ ତଥ୍ୟ'));
  console.log('✅ 2. Native Odia greeting handled successfully');

  // Test 3: Branch Discovery (Mechanical)
  const branchResp = await handleIncomingMessage({
    sessionId,
    message: 'ମେକାନିକାଲ୍ ଇଞ୍ଜିନିୟରିଂ ବିଷୟରେ କୁହନ୍ତୁ',
    selectedLanguage: 'or'
  });
  assert.strictEqual(branchResp.intent, 'BRANCH_DISCOVERY');
  assert.ok(branchResp.reply.includes('ମେକାନିକାଲ୍ ଇଞ୍ଜିନିୟରିଂ'));
  console.log('✅ 3. Odia branch discovery response verified');

  // Test 4: Eligibility Check with Marks (Odlish)
  const eligResp = await handleIncomingMessage({
    sessionId,
    message: 'mote mechanical re admission miliba ki 58% mark achi',
    selectedLanguage: 'or'
  });
  assert.strictEqual(eligResp.intent, 'ELIGIBILITY_CHECK');
  assert.ok(eligResp.reply.includes('ଯୋଗ୍ୟତା ମୂଲ୍ୟାଙ୍କନ ଫଳାଫଳ'));
  console.log('✅ 4. Odlish eligibility evaluation in conversation verified');

  // Test 5: Fee & Hostel Query (Hindi)
  const feeResp = await handleIncomingMessage({
    sessionId,
    message: 'मैकेनिकल इंजीनियरिंग की फीस और हॉस्टल का खर्च कितना है?',
    selectedLanguage: 'hi'
  });
  assert.strictEqual(feeResp.language, 'hi');
  assert.ok(feeResp.reply.includes('नमूना फीस संरचना'));
  assert.ok(feeResp.reply.includes('ट्यूशन फीस'));
  console.log('✅ 5. Hindi fee and hostel query verified');

  // Test 6: Lead / Counsellor Handoff with Phone Number
  const leadResp = await handleIncomingMessage({
    sessionId,
    message: 'मेरा नाम राहुल है और मेरा नंबर 9876543210 है, मुझे एडमिशन काउंसलर से बात करनी है',
    selectedLanguage: 'hi'
  });
  assert.ok(leadResp.enquiryTrackingId !== null);
  assert.ok(leadResp.handoffRequested === true);
  assert.ok(leadResp.reply.includes(leadResp.enquiryTrackingId));
  console.log(`✅ 6. Lead generation in chat verified! Tracking ID: ${leadResp.enquiryTrackingId}`);

  // Test 7: Dual-Key Verification against DB
  const savedStudent = await Student.findOne({ mobileNumber: '9876543210' });
  assert.ok(savedStudent);
  const savedEnquiry = await Enquiry.findOne({ trackingId: leadResp.enquiryTrackingId, studentId: savedStudent._id });
  assert.ok(savedEnquiry);
  assert.strictEqual(savedEnquiry.status, 'NEW');
  console.log('✅ 7. Dual-key enquiry records verified in database');

  await mongoose.disconnect();
  console.log('🎉 ALL INTEGRATION TESTS PASSED (7/7)');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
