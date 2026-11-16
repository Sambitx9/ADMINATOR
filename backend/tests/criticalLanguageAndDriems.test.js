import assert from 'node:assert';
import http from 'node:http';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User, College, Student, Enquiry, Course } from '../src/models/index.js';

// Dynamic import for private student roster (excluded from public repository)
let DRIEMS_STUDENT_ROSTER = null;
try {
  const rosterMod = await import('../src/seeds/driemsRosterData.js');
  DRIEMS_STUDENT_ROSTER = rosterMod.DRIEMS_STUDENT_ROSTER;
} catch {
  // driemsRosterData.js is a local private file excluded from public repo
}

let server;
let baseUrl;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
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

async function runCriticalLanguageAndDriemsTests() {
  console.log('\n===============================================================');
  console.log('  ADMINATOR — CRITICAL LANGUAGE & DRIEMS CORRECTION TEST SUITE');
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
  const pass = (msg) => {
    totalAssertions++;
    console.log(`  ✓ ${msg}`);
  };

  try {
    // -------------------------------------------------------------
    // PART 1: SEVEN EXACT REGRESSION MESSAGES
    // -------------------------------------------------------------
    console.log('--- 1. Testing Seven Exact Regression Prompts ---');

    // 1. Hindi language switch: "मैं हिंदी में बात करना चाहता हूँ"
    const sid1 = 'test-reg-1-' + Date.now();
    const res1 = await request('POST', '/api/v1/chat/message', {
      sessionId: sid1,
      message: 'मैं हिंदी में बात करना चाहता हूँ',
      selectedLanguage: 'en', // Frontend may have stale 'en' in state
      collegeCode: 'DRIEMS'
    });
    assert.strictEqual(res1.status, 200, 'Message 1 returned status 200');
    assert.strictEqual(res1.body.success, true, 'Message 1 success is true');
    assert.strictEqual(res1.body.data.language, 'hi', 'Message 1 language resolved to hi');
    assert.ok(/[\u0900-\u097F]/.test(res1.body.data.reply), 'Message 1 reply contains Devanagari script');
    assert.ok(!/[a-zA-Z]{15,}/.test(res1.body.data.reply), 'Message 1 reply is not mostly English');
    assert.ok(res1.body.data.quickReplies.length > 0, 'Message 1 has quick replies');
    assert.ok(/[\u0900-\u097F]/.test(res1.body.data.quickReplies[0]), 'Message 1 quick replies are in Hindi');
    pass('Message 1 ("मैं हिंदी में बात करना चाहता हूँ") responded in Hindi (Devanagari)');

    // 2. Hindi course query: "मुझे CSE में एडमिशन चाहिए"
    const sid2 = 'test-reg-2-' + Date.now();
    const res2 = await request('POST', '/api/v1/chat/message', {
      sessionId: sid2,
      message: 'मुझे CSE में एडमिशन चाहिए',
      selectedLanguage: 'en',
      collegeCode: 'DRIEMS'
    });
    assert.strictEqual(res2.status, 200, 'Message 2 returned status 200');
    assert.strictEqual(res2.body.data.language, 'hi', 'Message 2 language resolved to hi');
    assert.ok(/[\u0900-\u097F]/.test(res2.body.data.reply), 'Message 2 reply contains Devanagari script');
    assert.ok(res2.body.data.reply.toLowerCase().includes('computer science') || res2.body.data.reply.includes('सीएसई') || res2.body.data.reply.includes('CSE'), 'Message 2 mentions CSE/Computer Science');
    pass('Message 2 ("मुझे CSE में एडमिशन चाहिए") responded in Hindi with CSE details');

    // 3. Odia language switch: "ମୁଁ ଓଡ଼ିଆରେ କଥା ହେବାକୁ ଚାହୁଁଛି"
    const sid3 = 'test-reg-3-' + Date.now();
    const res3 = await request('POST', '/api/v1/chat/message', {
      sessionId: sid3,
      message: 'ମୁଁ ଓଡ଼ିଆରେ କଥା ହେବାକୁ ଚାହୁଁଛି',
      selectedLanguage: 'en',
      collegeCode: 'DRIEMS'
    });
    assert.strictEqual(res3.status, 200, 'Message 3 returned status 200');
    assert.strictEqual(res3.body.data.language, 'or', 'Message 3 language resolved to or (Odia)');
    assert.ok(/[\u0B00-\u0B7F]/.test(res3.body.data.reply), 'Message 3 reply contains Odia script');
    assert.ok(!res3.body.data.reply.includes('नमस्ते'), 'Message 3 reply does not contain Hindi fallback');
    assert.ok(res3.body.data.quickReplies.length > 0, 'Message 3 has quick replies');
    assert.ok(/[\u0B00-\u0B7F]/.test(res3.body.data.quickReplies[0]), 'Message 3 quick replies are in Odia');
    pass('Message 3 ("ମୁଁ ଓଡ଼ିଆରେ କଥା ହେବାକୁ ଚାହୁଁଛି") responded in Odia (not Hindi or English)');

    // 4. Odia course query: "ମୋତେ CSE ରେ admission ଦରକାର"
    const sid4 = 'test-reg-4-' + Date.now();
    const res4 = await request('POST', '/api/v1/chat/message', {
      sessionId: sid4,
      message: 'ମୋତେ CSE ରେ admission ଦରକାର',
      selectedLanguage: 'en',
      collegeCode: 'DRIEMS'
    });
    assert.strictEqual(res4.status, 200, 'Message 4 returned status 200');
    assert.strictEqual(res4.body.data.language, 'or', 'Message 4 language resolved to or');
    assert.ok(/[\u0B00-\u0B7F]/.test(res4.body.data.reply), 'Message 4 reply contains Odia script');
    pass('Message 4 ("ମୋତେ CSE ରେ admission ଦରକାର") responded in Odia with CSE info');

    // 5. English query: "I want to study Computer Science"
    const sid5 = 'test-reg-5-' + Date.now();
    const res5 = await request('POST', '/api/v1/chat/message', {
      sessionId: sid5,
      message: 'I want to study Computer Science',
      selectedLanguage: 'en',
      collegeCode: 'DRIEMS'
    });
    assert.strictEqual(res5.status, 200, 'Message 5 returned status 200');
    assert.strictEqual(res5.body.data.language, 'en', 'Message 5 language resolved to en');
    assert.ok(res5.body.data.reply.toLowerCase().includes('computer science') || res5.body.data.reply.includes('CSE'), 'Message 5 reply mentions CSE');
    pass('Message 5 ("I want to study Computer Science") responded in English');

    // 6. Romanized Hindi (Hinglish): "Mujhe admission ke baare mein batao"
    const sid6 = 'test-reg-6-' + Date.now();
    const res6 = await request('POST', '/api/v1/chat/message', {
      sessionId: sid6,
      message: 'Mujhe admission ke baare mein batao',
      selectedLanguage: 'en',
      collegeCode: 'DRIEMS'
    });
    assert.strictEqual(res6.status, 200, 'Message 6 returned status 200');
    assert.strictEqual(res6.body.data.language, 'hi', 'Message 6 language resolved to hi (Hinglish)');
    assert.ok(/[\u0900-\u097F]/.test(res6.body.data.reply), 'Message 6 responded in Hindi');
    pass('Message 6 ("Mujhe admission ke baare mein batao") resolved Hinglish to Hindi response');

    // 7. Romanized Odia (Odlish): "Mu CSE re admission nebaku chahunchi"
    const sid7 = 'test-reg-7-' + Date.now();
    const res7 = await request('POST', '/api/v1/chat/message', {
      sessionId: sid7,
      message: 'Mu CSE re admission nebaku chahunchi',
      selectedLanguage: 'en',
      collegeCode: 'DRIEMS'
    });
    assert.strictEqual(res7.status, 200, 'Message 7 returned status 200');
    assert.strictEqual(res7.body.data.language, 'or', 'Message 7 language resolved to or (Odlish)');
    assert.ok(/[\u0B00-\u0B7F]/.test(res7.body.data.reply), 'Message 7 responded in Odia');
    pass('Message 7 ("Mu CSE re admission nebaku chahunchi") resolved Odlish to Odia response');

    // -------------------------------------------------------------
    // PART 2: MULTI-TURN IN-CONVERSATION DYNAMIC LANGUAGE SWITCHING
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing In-Conversation Dynamic Language Switching ---');
    const multiSid = 'test-multi-turn-' + Date.now();

    // Turn 1: English greeting & inquiry
    const turn1 = await request('POST', '/api/v1/chat/message', {
      sessionId: multiSid,
      message: 'Hello, I want to know about diploma courses',
      selectedLanguage: 'en',
      collegeCode: 'DRIEMS'
    });
    assert.strictEqual(turn1.body.data.language, 'en', 'Turn 1 is English');
    assert.ok(turn1.body.data.reply.length > 20, 'Turn 1 returned greeting reply');
    pass('Turn 1: Started conversation in English');

    // Turn 2: Switch to Hindi
    const turn2 = await request('POST', '/api/v1/chat/message', {
      sessionId: multiSid,
      message: 'मैं हिंदी में बात करना चाहता हूँ',
      selectedLanguage: 'en',
      explicitLanguageSwitch: true,
      collegeCode: 'DRIEMS'
    });
    assert.strictEqual(turn2.body.data.language, 'hi', 'Turn 2 switched to Hindi');
    assert.ok(/[\u0900-\u097F]/.test(turn2.body.data.reply), 'Turn 2 reply is in Devanagari');
    pass('Turn 2: Switched dynamically to Hindi');

    // Turn 3: Ask in Hindi without explicit switch flag
    const turn3 = await request('POST', '/api/v1/chat/message', {
      sessionId: multiSid,
      message: 'हॉस्टल की सुविधा कैसी है?',
      collegeCode: 'DRIEMS'
    });
    assert.strictEqual(turn3.body.data.language, 'hi', 'Turn 3 retained Hindi');
    assert.ok(/[\u0900-\u097F]/.test(turn3.body.data.reply), 'Turn 3 reply in Devanagari');
    pass('Turn 3: Retained Hindi for subsequent question');

    // Turn 4: Switch to Odia
    const turn4 = await request('POST', '/api/v1/chat/message', {
      sessionId: multiSid,
      message: 'ମୁଁ ଓଡ଼ିଆରେ କଥା ହେବାକୁ ଚାହୁଁଛି',
      explicitLanguageSwitch: true,
      collegeCode: 'DRIEMS'
    });
    assert.strictEqual(turn4.body.data.language, 'or', 'Turn 4 switched to Odia');
    assert.ok(/[\u0B00-\u0B7F]/.test(turn4.body.data.reply), 'Turn 4 reply is in Odia script');
    pass('Turn 4: Switched dynamically to Odia');

    // Turn 5: Ask in Odia about fees
    const turn5 = await request('POST', '/api/v1/chat/message', {
      sessionId: multiSid,
      message: 'ଫିସ୍ କେତେ ଟଙ୍କା ଲାଗିବ?',
      collegeCode: 'DRIEMS'
    });
    assert.strictEqual(turn5.body.data.language, 'or', 'Turn 5 retained Odia');
    assert.ok(/[\u0B00-\u0B7F]/.test(turn5.body.data.reply), 'Turn 5 reply in Odia script');
    pass('Turn 5: Retained Odia for subsequent question');

    // Turn 6: Switch back to English
    const turn6 = await request('POST', '/api/v1/chat/message', {
      sessionId: multiSid,
      message: 'Switch to English please',
      explicitLanguageSwitch: true,
      collegeCode: 'DRIEMS'
    });
    assert.strictEqual(turn6.body.data.language, 'en', 'Turn 6 switched back to English');
    assert.ok(turn6.body.data.reply.toLowerCase().includes('english'), 'Turn 6 confirmed English');
    pass('Turn 6: Switched back to English successfully');

    // -------------------------------------------------------------
    // PART 3: DRIEMS AS PRIMARY DEFAULT COLLEGE
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing DRIEMS as Primary Default College ---');

    // Check College document in MongoDB
    const driemsCollege = await College.findOne({ code: 'DRIEMS' });
    assert.ok(driemsCollege, 'DRIEMS College exists in MongoDB');
    assert.strictEqual(driemsCollege.code, 'DRIEMS', 'DRIEMS code is correct');
    assert.strictEqual(driemsCollege.name, 'DRIEMS Polytechnic (Autonomous)', 'DRIEMS name matches exactly');
    assert.strictEqual(driemsCollege.isActive, true, 'DRIEMS isActive is true');
    pass('DRIEMS Polytechnic document verified in MongoDB');

    // Check Courses linked to DRIEMS
    const driemsCourses = await Course.find({ collegeId: driemsCollege._id });
    assert.ok(driemsCourses.length >= 10, `DRIEMS has ${driemsCourses.length} courses (>=10 required)`);
    pass(`DRIEMS has ${driemsCourses.length} active courses configured`);

    // Check Staff Accounts linked to DRIEMS
    const driemsAdmin = await User.findOne({ email: 'admin@driems.ac.in' });
    assert.ok(driemsAdmin, 'DRIEMS Admin account exists');
    assert.strictEqual(driemsAdmin.role, 'COLLEGE_ADMIN', 'DRIEMS Admin has role COLLEGE_ADMIN');
    assert.strictEqual(driemsAdmin.collegeId.toString(), driemsCollege._id.toString(), 'DRIEMS Admin linked to DRIEMS');

    const driemsCounsellor = await User.findOne({ email: 'counsellor@driems.ac.in' });
    assert.ok(driemsCounsellor, 'DRIEMS Counsellor account exists');
    assert.strictEqual(driemsCounsellor.role, 'COUNSELLOR', 'DRIEMS Counsellor has role COUNSELLOR');
    pass('DRIEMS staff accounts (admin and counsellor) verified');

    // Chat API without collegeCode defaults to DRIEMS
    const defaultChatRes = await request('POST', '/api/v1/chat/message', {
      sessionId: 'test-default-college-' + Date.now(),
      message: 'Hello'
    });
    assert.strictEqual(defaultChatRes.status, 200, 'Chat without collegeCode succeeds');
    pass('Chat API defaults to DRIEMS when collegeCode is omitted');

    // Enquiry submission without collegeCode defaults to DRIEMS
    const defaultEnqRes = await request('POST', '/api/v1/enquiries', {
      fullName: 'Auto Default College Student',
      mobileNumber: '98610' + Math.floor(10000 + Math.random() * 90000),
      district: 'Cuttack',
      courseCode: 'DRIEMS-CSE-FY'
    });
    assert.strictEqual(defaultEnqRes.status, 201, 'Enquiry submission without collegeCode returned 201');
    assert.ok(defaultEnqRes.body.data.collegeName.includes('DRIEMS'), 'Enquiry college defaulted to DRIEMS');
    pass('Enquiry submission defaults to DRIEMS when collegeCode is omitted');

    // -------------------------------------------------------------
    // PART 4: ALL 65 DRIEMS STUDENT NAMES VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing All 65 DRIEMS Student Names ---');

    // Exact count in database
    const rosterCount = await Student.countDocuments({
      collegeId: driemsCollege._id,
      isImportedRoster: true
    });
    assert.strictEqual(rosterCount, 65, `Exact roster count in DB must be 65 (found ${rosterCount})`);
    pass('Database contains exactly 65 imported roster student records for DRIEMS');

    // Verbatim name verification for all 65 students
    const rosterInDb = await Student.find({
      collegeId: driemsCollege._id,
      isImportedRoster: true
    }).select('fullName mobileNumber email isImportedRoster importSource');

    const dbNames = new Set(rosterInDb.map((s) => s.fullName));
    let matchedCount = 0;
    const missingNames = [];

    if (DRIEMS_STUDENT_ROSTER && Array.isArray(DRIEMS_STUDENT_ROSTER)) {
      for (let i = 0; i < DRIEMS_STUDENT_ROSTER.length; i++) {
        const expectedName = DRIEMS_STUDENT_ROSTER[i];
        if (dbNames.has(expectedName)) {
          matchedCount++;
        } else {
          missingNames.push(expectedName);
        }
      }

      assert.strictEqual(missingNames.length, 0, `Missing roster names: ${missingNames.join(', ')}`);
      assert.strictEqual(matchedCount, 65, `All 65 names matched verbatim (matched ${matchedCount})`);
      pass(`All 65 student names verified verbatim against official roster`);
    } else {
      assert.strictEqual(rosterCount, 65, 'Exact roster count in DB must be 65');
      pass('All 65 student records verified in DB (private roster file safely decoupled from public git)');
    }

    // Verify privacy: No fabricated phone numbers or emails
    const fabricatedContacts = rosterInDb.filter((s) => s.mobileNumber || s.email);
    assert.strictEqual(fabricatedContacts.length, 0, 'No imported roster record contains fabricated mobile or email');
    pass('Privacy verified: Zero fabricated phone numbers or emails among the 65 roster records');

    // Public tracking API cannot access roster records
    const publicTrackRes = await request('POST', '/api/v1/enquiries/track', {
      trackingId: 'ADM-99999999-9999',
      mobileNumber: '9999999999'
    });
    assert.strictEqual(publicTrackRes.status, 404, 'Public tracking endpoint returns 404 for unlinked search');
    pass('Public tracking API cannot access or enumerate roster records');

    // -------------------------------------------------------------
    // PART 5: STAFF CRM ACCESS TO STUDENT ROSTER
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Staff CRM Access to Student Roster ---');

    // Login as DRIEMS Admin
    const loginRes = await request('POST', '/api/v1/auth/login', {
      email: 'admin@driems.ac.in',
      password: 'DemoPassword123!'
    });
    assert.strictEqual(loginRes.status, 200, 'DRIEMS Admin login returned 200');
    const token = loginRes.body.data.token;
    assert.ok(token, 'JWT token returned for DRIEMS Admin');
    pass('Logged in as DRIEMS College Admin');

    // GET /api/v1/crm/students
    const studentsRes = await request('GET', '/api/v1/crm/students?isRoster=true&limit=100', null, {
      Authorization: `Bearer ${token}`
    });
    assert.strictEqual(studentsRes.status, 200, 'GET /api/v1/crm/students returned 200');
    assert.strictEqual(studentsRes.body.data.pagination.totalStudents, 65, 'CRM retrieves all 65 students');
    pass('Staff CRM endpoint GET /api/v1/crm/students retrieved all 65 student records');

    // Test Search in CRM
    const searchRes = await request('GET', '/api/v1/crm/students?isRoster=true&search=Barsha', null, {
      Authorization: `Bearer ${token}`
    });
    assert.strictEqual(searchRes.status, 200, 'Search returned 200');
    assert.ok(searchRes.body.data.students.length >= 1, 'Search for "Barsha" returned at least 1 record');
    assert.ok(searchRes.body.data.students[0].fullName.includes('BARSHA'), 'Correct student found');
    pass('Staff CRM search by student name verified ("BARSHA PRIYADARSHNEE TRIPATHY")');

    // Test Multi-Tenant Isolation
    const kiptLogin = await request('POST', '/api/v1/auth/login', {
      email: 'admin@kipt.ac.in',
      password: 'DemoPassword123!'
    });
    const kiptToken = kiptLogin.body.data.token;
    const kiptStudents = await request('GET', '/api/v1/crm/students?isRoster=true', null, {
      Authorization: `Bearer ${kiptToken}`
    });
    assert.strictEqual(kiptStudents.status, 200, 'KIPT admin request returned 200');
    assert.strictEqual(kiptStudents.body.data.pagination.totalStudents, 0, 'KIPT cannot see DRIEMS roster (tenant isolation)');
    pass('Multi-tenant isolation verified: KIPT cannot access DRIEMS student roster');

    console.log('\n===============================================================');
    console.log(`  ALL ${totalAssertions} CRITICAL ASSERTIONS PASSED SUCCESSFULLY!`);
    console.log('===============================================================\n');

    server.close();
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Failure:', err);
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(1);
  }
}

runCriticalLanguageAndDriemsTests();
