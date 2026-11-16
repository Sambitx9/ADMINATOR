import assert from 'node:assert';
import http from 'node:http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../src/app.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/adminator_demo';

console.log('--- ADMINATOR REST API SUITE TEST ---');

let server;
let baseUrl;

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Start temporary HTTP server on random port
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`✅ Test server running on ${baseUrl}`);
      resolve();
    });
  });

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/api/v1/health`);
  assert.strictEqual(healthRes.status, 200);
  const healthJson = await healthRes.json();
  assert.strictEqual(healthJson.data.status, 'OPERATIONAL');
  console.log('✅ 1. GET /api/v1/health returned 200 OPERATIONAL');

  // 2. Catalog: Colleges
  const collegesRes = await fetch(`${baseUrl}/api/v1/colleges`);
  assert.strictEqual(collegesRes.status, 200);
  const collegesJson = await collegesRes.json();
  assert.ok(collegesJson.data.length >= 3);
  console.log(`✅ 2. GET /api/v1/colleges returned ${collegesJson.data.length} colleges`);

  // 3. Catalog: Branches
  const branchesRes = await fetch(`${baseUrl}/api/v1/branches`);
  assert.strictEqual(branchesRes.status, 200);
  const branchesJson = await branchesRes.json();
  assert.ok(branchesJson.data.length >= 6);
  console.log(`✅ 3. GET /api/v1/branches returned ${branchesJson.data.length} branches`);

  // 4. Deterministic Eligibility Check Endpoint
  const eligRes = await fetch(`${baseUrl}/api/v1/eligibility/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      branchCode: 'MECH',
      pathway: 'FIRST_YEAR',
      candidate: {
        qualifyingExam: '10TH',
        aggregatePercentage: 62.5,
        ageYears: 16,
        passedMathAndScience: true,
        category: 'GENERAL'
      },
      language: 'or'
    })
  });
  assert.strictEqual(eligRes.status, 200);
  const eligJson = await eligRes.json();
  if (eligJson.data.verdict !== 'ELIGIBLE') {
    console.log('Eligibility payload returned:', JSON.stringify(eligJson.data, null, 2));
  }
  assert.strictEqual(eligJson.data.verdict, 'ELIGIBLE');
  console.log('✅ 4. POST /api/v1/eligibility/check returned ELIGIBLE with Odia response');

  // 5. Chat Message Endpoint (Simulator Engine)
  const chatSessionId = 'api-session-' + Date.now();
  const chatRes = await fetch(`${baseUrl}/api/v1/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: chatSessionId,
      message: 'What branches are available in diploma?',
      selectedLanguage: 'en'
    })
  });
  assert.strictEqual(chatRes.status, 200);
  const chatJson = await chatRes.json();
  assert.strictEqual(chatJson.data.intent, 'BRANCH_DISCOVERY');
  assert.ok(chatJson.data.quickReplies.length > 0);
  console.log('✅ 5. POST /api/v1/chat/message returned valid counselling reply');

  // 6. Chat History Endpoint
  const histRes = await fetch(`${baseUrl}/api/v1/chat/history/${chatSessionId}`);
  assert.strictEqual(histRes.status, 200);
  const histJson = await histRes.json();
  assert.strictEqual(histJson.data.messages.length, 2); // 1 user + 1 bot
  console.log('✅ 6. GET /api/v1/chat/history/:sessionId returned saved messages');

  // 7. Formal Enquiry Submission Endpoint
  const enquiryRes = await fetch(`${baseUrl}/api/v1/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Sanjay Mohanty',
      mobileNumber: '9123456780',
      email: 'sanjay.demo@example.com',
      district: 'Cuttack',
      preferredLanguage: 'or',
      collegeCode: 'UPP',
      interestedBranches: ['CIVIL'],
      pathway: 'FIRST_YEAR',
      academicRecord: {
        qualifyingExam: '10TH',
        aggregatePercentage: 58.5,
        marksMath: 55,
        marksScience: 60,
        passingYear: 2025
      },
      remarks: 'Interested in Civil Engineering at CDA Cuttack campus'
    })
  });
  assert.strictEqual(enquiryRes.status, 201);
  const enquiryJson = await enquiryRes.json();
  const newTrackingId = enquiryJson.data.trackingId;
  assert.ok(newTrackingId);
  console.log(`✅ 7. POST /api/v1/enquiries created enquiry: ${newTrackingId}`);

  // 8. Dual-Key Tracking Endpoint
  const trackRes = await fetch(`${baseUrl}/api/v1/enquiries/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trackingId: newTrackingId,
      mobileNumber: '9123456780'
    })
  });
  assert.strictEqual(trackRes.status, 200);
  const trackJson = await trackRes.json();
  assert.strictEqual(trackJson.data.trackingId, newTrackingId);
  assert.strictEqual(trackJson.data.studentName, 'Sanjay Mohanty');
  console.log('✅ 8. POST /api/v1/enquiries/track verified enquiry via dual-key lookup');

  // 9. Unauthorized / Missing Key Test (Security verification)
  const badTrackRes = await fetch(`${baseUrl}/api/v1/enquiries/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trackingId: newTrackingId,
      mobileNumber: '9999999999' // wrong phone
    })
  });
  assert.strictEqual(badTrackRes.status, 404);
  console.log('✅ 9. Security test: Dual-key mismatch properly returned 404 NOT_FOUND');

  server.close();
  await mongoose.disconnect();
  console.log('🎉 ALL 9 REST API ENDPOINT TESTS PASSED CLEANLY');
}

run().catch(err => {
  console.error('❌ API Suite error:', err);
  if (server) server.close();
  process.exit(1);
});
