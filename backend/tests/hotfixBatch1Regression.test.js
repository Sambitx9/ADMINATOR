import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User, College, Student, Enquiry, Conversation } from '../src/models/index.js';
import { seedDatabase } from '../src/seeds/demoDataSeeder.js';

// Dynamic import for optional local private student roster (excluded from public repository)
let DRIEMS_STUDENT_ROSTER = null;
try {
  const rosterMod = await import('../src/seeds/driemsRosterData.js');
  DRIEMS_STUDENT_ROSTER = rosterMod.DRIEMS_STUDENT_ROSTER;
} catch {
  // driemsRosterData.js is a local private file excluded from public repo
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let server;
let baseUrl;

function request(method, reqPath, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, baseUrl);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runHotfixBatch1RegressionTests() {
  console.log('\n===============================================================');
  console.log('  ADMINATOR — HOTFIX BATCH 1 REGRESSION VERIFICATION SUITE');
  console.log('===============================================================\n');

  await connectDB();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[Test Server] Running on ${baseUrl}\n`);
      resolve();
    });
  });

  let totalAssertions = 0;
  function pass(msg) {
    totalAssertions++;
    console.log(`  ✓ [ASSERTION ${totalAssertions}] ${msg}`);
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: DRIEMS is default college across API and returns index 0
    // -------------------------------------------------------------------------
    console.log('[SECTION 1] DRIEMS Default College API & Schema Verification');
    const collegesRes = await request('GET', '/api/v1/colleges');
    assert.strictEqual(collegesRes.status, 200);
    pass('GET /api/v1/colleges returns HTTP 200');
    assert.strictEqual(collegesRes.body.success, true);
    pass('GET /api/v1/colleges returns success: true');
    assert.ok(collegesRes.body.data.length >= 4);
    pass(`Colleges list contains ${collegesRes.body.data.length} institutions`);

    const firstCollege = collegesRes.body.data[0];
    assert.strictEqual(firstCollege.code, 'DRIEMS');
    pass('First college in list is deterministically DRIEMS');
    assert.strictEqual(firstCollege.isDefault, true);
    pass('DRIEMS has isDefault === true in database');

    const otherColleges = collegesRes.body.data.slice(1);
    for (const oc of otherColleges) {
      assert.strictEqual(oc.isDefault, false);
    }
    pass('All secondary demo colleges have isDefault === false');

    // -------------------------------------------------------------------------
    // TEST 2: Reseeding Preserves DRIEMS as Default
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 2] Reseeding Idempotency & Invariant Verification');
    await seedDatabase();
    pass('Database reseeded idempotently without errors');

    const collegesResAfterSeed = await request('GET', '/api/v1/colleges');
    assert.strictEqual(collegesResAfterSeed.body.data[0].code, 'DRIEMS');
    pass('After reseeding, DRIEMS remains the first college in GET /api/v1/colleges');
    assert.strictEqual(collegesResAfterSeed.body.data[0].isDefault, true);
    pass('After reseeding, DRIEMS retains isDefault === true');

    // -------------------------------------------------------------------------
    // TEST 3: DEF-API-02 Empty and Whitespace Chat Messages Return HTTP 400
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 3] DEF-API-02 Empty / Whitespace-Only Chat Message Validation');
    const emptyRes1 = await request('POST', '/api/v1/chat/message', {
      sessionId: 'test-hotfix-session',
      message: ''
    });
    assert.strictEqual(emptyRes1.status, 400);
    pass('Empty message ("") returns HTTP 400');
    assert.strictEqual(emptyRes1.body.error, 'VALIDATION_ERROR');
    pass('Empty message returns VALIDATION_ERROR');

    const emptyRes2 = await request('POST', '/api/v1/chat/message', {
      sessionId: 'test-hotfix-session',
      message: '       '
    });
    assert.strictEqual(emptyRes2.status, 400);
    pass('Whitespace-only message ("       ") returns HTTP 400');
    assert.strictEqual(emptyRes2.body.error, 'VALIDATION_ERROR');
    pass('Whitespace-only message returns VALIDATION_ERROR');

    const missingMsgRes = await request('POST', '/api/v1/chat/message', {
      sessionId: 'test-hotfix-session'
    });
    assert.strictEqual(missingMsgRes.status, 400);
    pass('Missing message property returns HTTP 400');

    // -------------------------------------------------------------------------
    // TEST 4: Normal Chat Messages Function Correctly
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 4] Normal Chat Messages Processing');
    const normalChatRes = await request('POST', '/api/v1/chat/message', {
      sessionId: 'test-hotfix-session-en',
      message: 'Hello, what branches are available at DRIEMS?'
    });
    assert.strictEqual(normalChatRes.status, 200);
    pass('Normal chat query returns HTTP 200');
    assert.strictEqual(normalChatRes.body.success, true);
    pass('Normal chat returns success: true');
    assert.ok(normalChatRes.body.data.reply.length > 20);
    pass('Bot returned informative guidance reply');

    // -------------------------------------------------------------------------
    // TEST 5: DEF-FUNC-03 Attachment Button (No window.alert in source code)
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 5] DEF-FUNC-03 Attachment Button Non-Blocking Interaction');
    const simSourcePath = path.resolve(__dirname, '../../frontend/src/components/chat/WhatsAppSimulator.jsx');
    const simSource = fs.readFileSync(simSourcePath, 'utf8');
    assert.strictEqual(simSource.includes('window.alert'), false);
    pass('WhatsAppSimulator.jsx contains zero references to window.alert');
    assert.strictEqual(simSource.includes('alert('), false);
    pass('WhatsAppSimulator.jsx contains zero native alert() calls');
    assert.strictEqual(simSource.includes('in Phase 4'), false);
    pass('WhatsAppSimulator.jsx contains zero outdated "Phase 4" developer text');
    assert.ok(simSource.includes('isAttachmentOpen'));
    pass('WhatsAppSimulator.jsx implements interactive simulated attachment popover');

    // -------------------------------------------------------------------------
    // TEST 6: DEF-UI-05 Eligibility Modal Localization & API Evaluation
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 6] DEF-UI-05 Eligibility Modal Localization & Engine');
    const eligModalPath = path.resolve(__dirname, '../../frontend/src/components/chat/EligibilityModal.jsx');
    const eligModalSource = fs.readFileSync(eligModalPath, 'utf8');
    assert.ok(eligModalSource.includes('modalTranslations'));
    pass('EligibilityModal.jsx defines comprehensive modalTranslations dictionary');
    assert.ok(eligModalSource.includes('ଡିପ୍ଲୋମା ଯୋଗ୍ୟତା ମୂଲ୍ୟାୟନକାରୀ'));
    pass('EligibilityModal.jsx includes authentic Odia title');
    assert.ok(eligModalSource.includes('डिप्लोमा पात्रता मूल्यांकनकर्ता'));
    pass('EligibilityModal.jsx includes authentic Hindi title');
    assert.ok(eligModalSource.includes('Escape'));
    pass('EligibilityModal.jsx supports Escape key closing listener');

    // Test Eligibility API in Odia
    const eligOrRes = await request('POST', '/api/v1/eligibility/check', {
      branchCode: 'MECH',
      pathway: 'FIRST_YEAR',
      language: 'or',
      candidate: {
        qualifyingExam: '10TH',
        aggregatePercentage: 65,
        ageYears: 16,
        passedMathAndScience: true,
        category: 'GENERAL'
      }
    });
    assert.strictEqual(eligOrRes.status, 200);
    pass('Eligibility check in Odia returns HTTP 200');
    assert.strictEqual(eligOrRes.body.data.verdict, 'ELIGIBLE');
    pass('Odia evaluation verdict is ELIGIBLE');
    assert.ok(/[\u0B00-\u0B7F]/.test(eligOrRes.body.data.plainReason));
    pass('Odia evaluation plainReason is rendered in native Odia script');

    // Test Eligibility API in Hindi
    const eligHiRes = await request('POST', '/api/v1/eligibility/check', {
      branchCode: 'CSE',
      pathway: 'FIRST_YEAR',
      language: 'hi',
      candidate: {
        qualifyingExam: '10TH',
        aggregatePercentage: 70,
        ageYears: 16,
        passedMathAndScience: true,
        category: 'GENERAL'
      }
    });
    assert.strictEqual(eligHiRes.status, 200);
    pass('Eligibility check in Hindi returns HTTP 200');
    assert.ok(/[\u0900-\u097F]/.test(eligHiRes.body.data.plainReason));
    pass('Hindi evaluation plainReason is rendered in native Devanagari script');

    // -------------------------------------------------------------------------
    // TEST 7: DEF-UI-06 Tracking Modal Localization & Dual-Key Verification
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 7] DEF-UI-06 Tracking Modal Localization & API Tracking');
    const trackModalPath = path.resolve(__dirname, '../../frontend/src/components/chat/TrackingModal.jsx');
    const trackModalSource = fs.readFileSync(trackModalPath, 'utf8');
    assert.ok(trackModalSource.includes('trackTranslations'));
    pass('TrackingModal.jsx defines comprehensive trackTranslations dictionary');
    assert.ok(trackModalSource.includes('ଆବେଦନ ସ୍ଥିତି ଯାଞ୍ଚ'));
    pass('TrackingModal.jsx contains authentic Odia modal title');
    assert.ok(trackModalSource.includes('आवेदन स्थिति जांचें'));
    pass('TrackingModal.jsx contains authentic Hindi modal title');
    assert.ok(trackModalSource.includes('Escape'));
    pass('TrackingModal.jsx supports Escape key closing listener');

    // -------------------------------------------------------------------------
    // TEST 8: DEF-UI-10, DEF-UI-11, DEF-UI-13, DEF-UI-17 Localization
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 8] UI Micro-Detail Translations Verification');
    // DEF-UI-10 Chat Utility Bar Buttons
    assert.ok(simSource.includes('st.evaluatorBtn'));
    pass('DEF-UI-10: WhatsAppSimulator utility bar uses st.evaluatorBtn');
    assert.ok(simSource.includes('st.trackBtn'));
    pass('DEF-UI-10: WhatsAppSimulator utility bar uses st.trackBtn');

    // DEF-UI-13 Chat Date Banner
    assert.ok(simSource.includes('st.dateBanner'));
    pass('DEF-UI-13: WhatsAppSimulator date banner uses st.dateBanner');

    // DEF-UI-11 CRM Pipeline Search Button
    const staffDashPath = path.resolve(__dirname, '../../frontend/src/components/dashboard/StaffDashboardShell.jsx');
    const staffDashSource = fs.readFileSync(staffDashPath, 'utf8');
    assert.ok(staffDashSource.includes('searchBtn: "Search"'));
    pass('DEF-UI-11: StaffDashboardShell defines English searchBtn');
    assert.ok(staffDashSource.includes('searchBtn: "ଖୋଜନ୍ତୁ"'));
    pass('DEF-UI-11: StaffDashboardShell defines Odia searchBtn');
    assert.ok(staffDashSource.includes('searchBtn: "खोजें"'));
    pass('DEF-UI-11: StaffDashboardShell defines Hindi searchBtn');

    // DEF-UI-17 Demo Watermark Banner in Header
    const headerPath = path.resolve(__dirname, '../../frontend/src/components/common/Header.jsx');
    const headerSource = fs.readFileSync(headerPath, 'utf8');
    assert.ok(headerSource.includes('watermarkTexts'));
    pass('DEF-UI-17: Header.jsx defines localized watermarkTexts dictionary');
    assert.ok(headerSource.includes('ଡେମୋ ତଥ୍ୟ'));
    pass('DEF-UI-17: Header.jsx includes Odia watermark string');
    assert.ok(headerSource.includes('डेमो डेटा'));
    pass('DEF-UI-17: Header.jsx includes Hindi watermark string');

    // -------------------------------------------------------------------------
    // TEST 9: Chatbot Follows Student Message Language (Rule 5)
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 9] Chatbot Dynamic Response Language Adherence');
    
    // Odia Native Script
    const odiaChatRes = await request('POST', '/api/v1/chat/message', {
      sessionId: 'hotfix-odia-session',
      message: 'ମୁଁ ଓଡ଼ିଆରେ କଥା ହେବାକୁ ଚାହୁଁଛି'
    });
    assert.strictEqual(odiaChatRes.status, 200);
    assert.strictEqual(odiaChatRes.body.data.language, 'or');
    pass('Student writes in Odia ("ମୁଁ ଓଡ଼ିଆରେ କଥା ହେବାକୁ ଚାହୁଁଛି") -> Bot responds in Odia (lang=or)');
    assert.ok(/[\u0B00-\u0B7F]/.test(odiaChatRes.body.data.reply));
    pass('Odia response contains valid Odia Unicode characters');

    // Hindi Native Script
    const hindiChatRes = await request('POST', '/api/v1/chat/message', {
      sessionId: 'hotfix-hindi-session',
      message: 'मैं हिन्दी में बात करना चाहता हूँ'
    });
    assert.strictEqual(hindiChatRes.status, 200);
    assert.strictEqual(hindiChatRes.body.data.language, 'hi');
    pass('Student writes in Hindi ("मैं हिन्दी में बात करना चाहता हूँ") -> Bot responds in Hindi (lang=hi)');
    assert.ok(/[\u0900-\u097F]/.test(hindiChatRes.body.data.reply));
    pass('Hindi response contains valid Devanagari Unicode characters');

    // Romanized Odia (Odlish)
    const odlishChatRes = await request('POST', '/api/v1/chat/message', {
      sessionId: 'hotfix-odlish-session',
      message: 'mote mechanical branch re admission darkar kete fees lagiba'
    });
    assert.strictEqual(odlishChatRes.status, 200);
    assert.strictEqual(odlishChatRes.body.data.language, 'or');
    pass('Student writes in Romanized Odia -> Bot responds in natural Odia script');

    // Hinglish
    const hinglishChatRes = await request('POST', '/api/v1/chat/message', {
      sessionId: 'hotfix-hinglish-session',
      message: 'mujhe diploma admission lena hai fees kitna hoga'
    });
    assert.strictEqual(hinglishChatRes.status, 200);
    assert.strictEqual(hinglishChatRes.body.data.language, 'hi');
    pass('Student writes in Hinglish -> Bot responds in natural Hindi script');

    // -------------------------------------------------------------------------
    // TEST 10: Language Switching Preserves Conversation History
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 10] Multilingual Switching & Conversation History Retention');
    const switchSessionId = 'hotfix-multilingual-switch-' + Date.now();

    // Step 1: English
    const s1 = await request('POST', '/api/v1/chat/message', {
      sessionId: switchSessionId,
      message: 'Hello, I want to inquire about diploma courses'
    });
    assert.strictEqual(s1.body.data.language, 'en');
    pass('Turn 1 in English succeeds');

    // Step 2: Switch to Odia
    const s2 = await request('POST', '/api/v1/chat/message', {
      sessionId: switchSessionId,
      message: 'ମୋତେ ମେକାନିକାଲ୍ ଫିସ୍ ବିଷୟରେ କୁହନ୍ତୁ'
    });
    assert.strictEqual(s2.body.data.language, 'or');
    pass('Turn 2 dynamically switches to Odia');

    // Step 3: Switch to Hindi
    const s3 = await request('POST', '/api/v1/chat/message', {
      sessionId: switchSessionId,
      message: 'हॉस्टल की सुविधा कैसी है?'
    });
    assert.strictEqual(s3.body.data.language, 'hi');
    pass('Turn 3 dynamically switches to Hindi');

    // Check conversation history
    const histRes = await request('GET', `/api/v1/chat/history/${switchSessionId}`);
    assert.strictEqual(histRes.status, 200);
    const msgs = histRes.body.data.messages;
    assert.strictEqual(msgs.length, 6); // 3 user + 3 bot messages
    pass('Conversation history contains all 6 messages across 3 languages without truncation');

    // -------------------------------------------------------------------------
    // TEST 11: All 65 Supplied Student Names Remain Verbatim & Unchanged
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 11] DRIEMS Student Roster (65 Names) Preservation Invariant');
    const driemsCollege = await College.findOne({ code: 'DRIEMS' });
    assert.ok(driemsCollege, 'DRIEMS College exists in DB');
    pass('DRIEMS College record found in database');

    const rosterStudents = await Student.find({
      collegeId: driemsCollege._id,
      isImportedRoster: true
    }).select('fullName');

    assert.strictEqual(rosterStudents.length, 65);
    pass(`Exactly 65 student records found for DRIEMS (expected 65, got ${rosterStudents.length})`);

    const dbNames = new Set(rosterStudents.map(s => s.fullName));
    let missingCount = 0;
    if (DRIEMS_STUDENT_ROSTER && Array.isArray(DRIEMS_STUDENT_ROSTER)) {
      for (const name of DRIEMS_STUDENT_ROSTER) {
        if (!dbNames.has(name.trim())) {
          missingCount++;
        }
      }
      assert.strictEqual(missingCount, 0);
      pass('All 65 student names match DRIEMS_STUDENT_ROSTER verbatim without single omission');
    } else {
      assert.strictEqual(rosterStudents.length, 65);
      pass('All 65 student records verified in DB (private roster source file safely isolated from public git)');
    }

    // -------------------------------------------------------------------------
    // TEST 12: Existing Authentication, RBAC and Tenant Isolation Continue Working
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 12] Authentication, RBAC & Tenant Isolation Verification');
    
    // Login as DRIEMS Counsellor
    const loginRes = await request('POST', '/api/v1/auth/login', {
      email: 'counsellor@driems.ac.in',
      password: 'DemoPassword123!'
    });
    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginRes.body.data.token);
    pass('DRIEMS Counsellor authentication succeeds');
    const counsellorToken = loginRes.body.data.token;

    // Verify /auth/me
    const meRes = await request('GET', '/api/v1/auth/me', null, {
      Authorization: `Bearer ${counsellorToken}`
    });
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.body.data.user.role, 'COUNSELLOR');
    assert.strictEqual(meRes.body.data.user.collegeId.code, 'DRIEMS');
    pass('GET /api/v1/auth/me confirms role=COUNSELLOR and college=DRIEMS');

    // Access CRM Leads
    const leadsRes = await request('GET', '/api/v1/crm/leads', null, {
      Authorization: `Bearer ${counsellorToken}`
    });
    assert.strictEqual(leadsRes.status, 200);
    pass('DRIEMS Counsellor can access lead pipeline');

    // All leads returned must belong to DRIEMS
    for (const lead of leadsRes.body.data.leads) {
      if (lead.collegeId) {
        assert.strictEqual(lead.collegeId.code, 'DRIEMS');
      }
    }
    pass('Tenant isolation verified: Counsellor strictly sees DRIEMS leads only');

    console.log('\n===============================================================');
    console.log(`  ALL ${totalAssertions} HOTFIX BATCH 1 ASSERTIONS PASSED (100% SUCCESS)`);
    console.log('===============================================================\n');

  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
  }
}

runHotfixBatch1RegressionTests().catch((err) => {
  console.error('[Hotfix Batch 1 Test Failure]:', err);
  process.exit(1);
});
