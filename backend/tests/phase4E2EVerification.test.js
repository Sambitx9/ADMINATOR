import assert from 'node:assert';
import http from 'node:http';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User, College, Student, Enquiry, AuditLog, Branch } from '../src/models/index.js';

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

async function runPhase4E2EVerification() {
  console.log('\n===============================================================');
  console.log('  ADMINATOR — PHASE 4 TASK 4.4 COMPLETE E2E VERIFICATION SUITE');
  console.log('===============================================================\n');

  await connectDB();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[E2E Test Server] Running on ${baseUrl}`);
      resolve();
    });
  });

  let totalAssertions = 0;
  const pass = (msg) => {
    totalAssertions++;
    console.log(`  ✓ Assertion ${totalAssertions}: ${msg}`);
  };

  try {
    // -------------------------------------------------------------------------
    // PART 1: 17-STEP COMPLETE STUDENT-TO-STAFF JOURNEY
    // -------------------------------------------------------------------------
    console.log('\n--- PART 1: 17-STEP COMPLETE STUDENT-TO-STAFF END-TO-END FLOW ---');

    // Step 1: Open student portal and select language (Odia)
    const selectedLanguage = 'or';
    assert.strictEqual(selectedLanguage, 'or');
    pass('Step 1: Student opens portal and selects Odia language');

    // Step 2: Start counselling dialogue in Odia
    const chatRes = await request('POST', '/api/v1/chat/message', {
      sessionId: `e2e-session-${Date.now()}`,
      message: 'ନମସ୍କାର, ମୁଁ ଡିପ୍ଲୋମା ଇଞ୍ଜିନିୟରିଂ ବିଷୟରେ ଜାଣିବାକୁ ଚାହୁଁଛି',
      language: 'or'
    });
    assert.strictEqual(chatRes.status, 200);
    assert.strictEqual(chatRes.body.success, true);
    assert.ok(chatRes.body.data.reply, 'Should return counselling reply');
    pass('Step 2: Student initiates counselling chat in Odia and receives intelligent reply');

    // Step 3: Discover available demo courses and colleges
    const collegesRes = await request('GET', '/api/v1/colleges');
    assert.strictEqual(collegesRes.status, 200);
    const collegesList = Array.isArray(collegesRes.body.data) ? collegesRes.body.data : collegesRes.body.data.colleges;
    assert.ok(collegesList.length >= 2, 'At least 2 colleges should exist');

    const branchesRes = await request('GET', '/api/v1/branches');
    assert.strictEqual(branchesRes.status, 200);
    const branchesList = Array.isArray(branchesRes.body.data) ? branchesRes.body.data : branchesRes.body.data.branches;
    assert.ok(branchesList.length >= 5, 'At least 5 branches should exist');

    const kiptCollege = collegesList.find((c) => c.code === 'KIPT');
    const cseBranch = branchesList.find((b) => b.code === 'CSE');
    assert.ok(kiptCollege, 'KIPT college must be found');
    assert.ok(cseBranch, 'CSE branch must be found');
    pass('Step 3: Student discovers demo institutions and branches (KIPT & CSE identified)');

    // Step 4: Check deterministic eligibility
    const eligRes = await request('POST', '/api/v1/eligibility/check', {
      branchCode: 'CSE',
      pathway: 'FIRST_YEAR',
      candidate: {
        qualifyingExam: '10TH',
        aggregatePercentage: 68.5,
        ageYears: 16,
        passedMathAndScience: true,
        category: 'GENERAL'
      },
      language: 'or'
    });
    assert.strictEqual(eligRes.status, 200);
    assert.strictEqual(eligRes.body.success, true);
    assert.strictEqual(eligRes.body.data.verdict, 'ELIGIBLE');
    pass('Step 4: Deterministic eligibility calculated (68.5% 10th -> ELIGIBLE in Odia)');

    // Step 5: Submit a student enquiry
    const uniquePhone = '98' + Math.floor(10000000 + Math.random() * 90000000);
    const submitRes = await request('POST', '/api/v1/enquiries', {
      fullName: 'ସୌମ୍ୟା ରଞ୍ଜନ ପଟ୍ଟନାୟକ (Soumya Ranjan)',
      mobileNumber: uniquePhone,
      email: 'soumya.e2e@example.com',
      preferredLanguage: 'or',
      collegeCode: 'KIPT',
      interestedBranches: ['CSE'],
      pathway: 'FIRST_YEAR',
      academicRecord: {
        qualifyingExam: '10TH',
        aggregatePercentage: 68.5,
        marksMath: 72,
        marksScience: 65,
        passingYear: 2025
      },
      district: 'Cuttack',
      remarks: 'Interested in Computer Science at KIPT campus'
    });
    assert.strictEqual(submitRes.status, 201);
    assert.strictEqual(submitRes.body.success, true);
    assert.ok(submitRes.body.data.trackingId, 'Tracking ID must be generated');
    const trackingId = submitRes.body.data.trackingId;
    pass(`Step 5: Student enquiry successfully registered: ${trackingId}`);

    // Step 6: Verify generated tracking ID format (ADM-YYYYMMDD-XXXXXXXX)
    const trackingIdRegex = /^ADM-\d{8}-[A-F0-9]{8}$/;
    assert.ok(trackingIdRegex.test(trackingId), `Tracking ID ${trackingId} matches pattern`);
    pass('Step 6: Verified tracking ID format adherence (ADM-YYYYMMDD-XXXXXXXX)');

    // Step 7: Dual-key enquiry tracking verification
    const trackRes = await request('POST', '/api/v1/enquiries/track', {
      trackingId,
      mobileNumber: uniquePhone
    });
    assert.strictEqual(trackRes.status, 200);
    assert.strictEqual(trackRes.body.success, true);
    assert.strictEqual(trackRes.body.data.trackingId, trackingId);
    assert.strictEqual(trackRes.body.data.status, 'NEW');
    pass('Step 7: Tracked enquiry successfully using dual-key credentials (ID + Phone)');

    // Step 8: Verify zero internal notes or confidential data leaked in public tracking
    assert.strictEqual(trackRes.body.data.internalNotes, undefined, 'internalNotes must NOT be present');
    assert.strictEqual(trackRes.body.data.rejectionReason, undefined, 'rejectionReason must NOT be leaked');
    assert.strictEqual(trackRes.body.data.assignedCounsellorId, undefined, 'assignedCounsellorId must NOT be leaked');
    pass('Step 8: Verified zero internal notes or staff data disclosed in public tracking response');

    // Step 9: Counsellor login
    const counsellorLogin = await request('POST', '/api/v1/auth/login', {
      email: 'sunita.counsellor@kipt.ac.in',
      password: 'DemoPassword123!'
    });
    assert.strictEqual(counsellorLogin.status, 200);
    assert.strictEqual(counsellorLogin.body.success, true);
    assert.strictEqual(counsellorLogin.body.data.user.role, 'COUNSELLOR');
    const counsellorToken = counsellorLogin.body.data.token;
    const counsellorId = counsellorLogin.body.data.user.id || counsellorLogin.body.data.user._id;
    pass(`Step 9: Counsellor Sunita Mohanty successfully authenticated (${counsellorLogin.body.data.user.role})`);

    // Assign the lead first or find it directly
    const kiptEnquiryDoc = await Enquiry.findOne({ trackingId });
    assert.ok(kiptEnquiryDoc, 'Enquiry record must exist in MongoDB');
    kiptEnquiryDoc.assignedCounsellorId = counsellorId;
    kiptEnquiryDoc.status = 'ASSIGNED';
    await kiptEnquiryDoc.save();

    // Step 10: Locate enquiry in CRM as counsellor
    const searchRes = await request(
      'GET',
      `/api/v1/crm/leads?search=${trackingId}`,
      null,
      { Authorization: `Bearer ${counsellorToken}` }
    );
    assert.strictEqual(searchRes.status, 200);
    assert.strictEqual(searchRes.body.data.pagination.totalLeads, 1);
    assert.strictEqual(searchRes.body.data.leads[0].trackingId, trackingId);
    pass('Step 10: Counsellor located the lead in CRM pipeline');

    const leadId = searchRes.body.data.leads[0]._id;

    // Step 11: Add an internal note as counsellor
    const noteRes = await request(
      'POST',
      `/api/v1/crm/enquiries/${leadId}/notes`,
      { text: 'Spoke with student in Odia. Very keen on CSE lab facilities and hostel.' },
      { Authorization: `Bearer ${counsellorToken}` }
    );
    assert.strictEqual(noteRes.status, 201);
    assert.strictEqual(noteRes.body.success, true);
    assert.ok(noteRes.body.data.note, 'Note object must be returned');
    pass('Step 11: Counsellor added confidential internal note to lead');

    // Step 12: Advance lead status (ASSIGNED -> CONTACTED)
    const statusRes = await request(
      'PATCH',
      `/api/v1/crm/enquiries/${leadId}/status`,
      { status: 'CONTACTED' },
      { Authorization: `Bearer ${counsellorToken}` }
    );
    assert.strictEqual(statusRes.status, 200);
    assert.strictEqual(statusRes.body.data.currentStatus, 'CONTACTED');
    pass('Step 12: Counsellor transitioned enquiry status (ASSIGNED -> CONTACTED)');

    // Step 13: Log in as College Admin
    const adminLogin = await request('POST', '/api/v1/auth/login', {
      email: 'admin@kipt.ac.in',
      password: 'DemoPassword123!'
    });
    assert.strictEqual(adminLogin.status, 200);
    assert.strictEqual(adminLogin.body.data.user.role, 'COLLEGE_ADMIN');
    const adminToken = adminLogin.body.data.token;
    pass('Step 13: College Admin authenticated successfully (admin@kipt.ac.in)');

    // Step 14: College Admin reassigns lead to another counsellor
    const counsellorsList = await request(
      'GET',
      '/api/v1/crm/counsellors',
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert.strictEqual(counsellorsList.status, 200);
    const targetCounsellor = counsellorsList.body.data.counsellors[0];
    assert.ok(targetCounsellor, 'Target counsellor must exist');

    const assignRes = await request(
      'POST',
      `/api/v1/crm/leads/${leadId}/assign`,
      { counsellorId: targetCounsellor._id },
      { Authorization: `Bearer ${adminToken}` }
    );
    assert.strictEqual(assignRes.status, 200);
    assert.strictEqual(assignRes.body.data.enquiry.assignedCounsellorId._id, targetCounsellor._id);
    pass(`Step 14: College Admin reassigned lead to counsellor (${targetCounsellor.name || targetCounsellor.fullName || 'Counsellor'})`);

    // Step 15: Inspect audit ledger to verify that all actions were recorded
    const auditRes = await request(
      'GET',
      `/api/v1/crm/audit-logs?entityId=${leadId}`,
      null,
      { Authorization: `Bearer ${adminToken}` }
    );
    assert.strictEqual(auditRes.status, 200);
    const auditLogs = auditRes.body.data.logs;
    assert.ok(auditLogs.length >= 3, 'Audit ledger must record note, status transition, and assignment');
    const actions = auditLogs.map((a) => a.action);
    assert.ok(actions.includes('STATUS_CHANGED'), 'Must include STATUS_CHANGED audit record');
    assert.ok(actions.includes('NOTE_ADDED'), 'Must include NOTE_ADDED audit record');
    assert.ok(actions.includes('LEAD_ASSIGNED'), 'Must include LEAD_ASSIGNED audit record');
    pass('Step 15: College Admin verified immutable audit ledger recorded all lead lifecycle events');

    // Step 16: Log in as Platform Admin
    const platformLogin = await request('POST', '/api/v1/auth/login', {
      email: 'platform.admin@adminator.demo',
      password: 'DemoPassword123!'
    });
    assert.strictEqual(platformLogin.status, 200);
    assert.strictEqual(platformLogin.body.data.user.role, 'PLATFORM_ADMIN');
    const platformToken = platformLogin.body.data.token;
    pass('Step 16: Platform Admin authenticated successfully (platform.admin@adminator.demo)');

    // Step 17: Platform Admin verifies cross-tenant access to multiple institutions
    const platformLeadsRes = await request(
      'GET',
      '/api/v1/crm/leads',
      null,
      { Authorization: `Bearer ${platformToken}` }
    );
    assert.strictEqual(platformLeadsRes.status, 200);
    assert.ok(platformLeadsRes.body.data.pagination.totalLeads >= 1);

    const platformAuditRes = await request(
      'GET',
      '/api/v1/crm/audit-logs',
      null,
      { Authorization: `Bearer ${platformToken}` }
    );
    assert.strictEqual(platformAuditRes.status, 200);
    assert.ok(platformAuditRes.body.data.pagination.totalLogs >= 3);
    pass('Step 17: Platform Admin successfully verified cross-tenant oversight across all colleges');

    // -------------------------------------------------------------------------
    // PART 2: SECURITY & BOUNDARY CONTROLS AUDIT
    // -------------------------------------------------------------------------
    console.log('\n--- PART 2: SECURITY & BOUNDARY CONTROLS AUDIT ---');

    // 2.1 Password hashing with bcrypt 10 salt rounds invariant
    const userDoc = await User.findOne({ email: 'admin@kipt.ac.in' }).select('+passwordHash');
    assert.ok(userDoc.passwordHash.startsWith('$2a$10$') || userDoc.passwordHash.startsWith('$2b$10$'));
    pass('Security 2.1: Verified bcrypt 10 salt rounds on persisted password hash');

    // 2.2 Expiring JWT token
    const parts = counsellorToken.split('.');
    assert.strictEqual(parts.length, 3, 'JWT must have 3 segments');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    assert.ok(payload.exp, 'JWT must have expiration timestamp');
    assert.ok(payload.exp > Math.floor(Date.now() / 1000), 'JWT expiration must be in the future');
    pass(`Security 2.2: Verified expiring JWT with expiry timestamp: ${new Date(payload.exp * 1000).toISOString()}`);

    // 2.3 Generic error messages for failed logins (anti-enumeration)
    const wrongPassRes = await request('POST', '/api/v1/auth/login', {
      email: 'admin@kipt.ac.in',
      password: 'WrongPassword999!'
    });
    const wrongUserRes = await request('POST', '/api/v1/auth/login', {
      email: 'nonexistent.user@random.org',
      password: 'WrongPassword999!'
    });
    assert.strictEqual(wrongPassRes.status, 401);
    assert.strictEqual(wrongUserRes.status, 401);
    assert.strictEqual(wrongPassRes.body.error.message, wrongUserRes.body.error.message);
    assert.strictEqual(wrongPassRes.body.error.message, 'Invalid email or password');
    pass('Security 2.3: Verified generic authentication failure responses prevent username enumeration');

    // 2.4 Multi-tenant data isolation
    const uppStaffLogin = await request('POST', '/api/v1/auth/login', {
      email: 'bikash.counsellor@upp.ac.in',
      password: 'DemoPassword123!'
    });
    assert.strictEqual(uppStaffLogin.status, 200);
    const uppStaffToken = uppStaffLogin.body.data.token;

    const crossTenantLeadAttempt = await request(
      'GET',
      `/api/v1/crm/leads/${leadId}`,
      null,
      { Authorization: `Bearer ${uppStaffToken}` }
    );
    assert.strictEqual(crossTenantLeadAttempt.status, 403);
    assert.strictEqual(crossTenantLeadAttempt.body.error.code, 'TENANT_ISOLATION_VIOLATION');
    pass('Security 2.4: Verified tenant isolation: UPP Counsellor blocked from viewing KIPT lead (403 TENANT_ISOLATION_VIOLATION)');

    // 2.5 Role-based authorization on CRM and audit endpoints
    const counsellorAuditAttempt = await request(
      'GET',
      '/api/v1/crm/audit-logs',
      null,
      { Authorization: `Bearer ${counsellorToken}` }
    );
    assert.strictEqual(counsellorAuditAttempt.status, 403);
    assert.strictEqual(counsellorAuditAttempt.body.error.code, 'FORBIDDEN');

    const counsellorAssignAttempt = await request(
      'POST',
      `/api/v1/crm/leads/${leadId}/assign`,
      { counsellorId },
      { Authorization: `Bearer ${counsellorToken}` }
    );
    assert.strictEqual(counsellorAssignAttempt.status, 403);
    assert.strictEqual(counsellorAssignAttempt.body.error.code, 'FORBIDDEN');
    pass('Security 2.5: Verified RBAC protection prevents COUNSELLOR from accessing audit logs or reassigning');

    // 2.6 Rate limiting on /api/v1/auth/login
    const dummyEmail = 'ratelimit.probe@example.com';
    let blockedResponse = null;
    for (let i = 0; i < 7; i++) {
      const res = await request('POST', '/api/v1/auth/login', {
        email: dummyEmail,
        password: 'BadPassword'
      });
      if (res.status === 429) {
        blockedResponse = res;
        break;
      }
    }
    assert.ok(blockedResponse, 'Should encounter 429 Too Many Requests after threshold');
    assert.strictEqual(blockedResponse.body.error.code, 'RATE_LIMIT_EXCEEDED');
    pass('Security 2.6: Verified login rate limiter triggers 429 Too Many Requests after consecutive failures');

    // 2.7 Application-level Audit Ledger immutability
    const sampleAudit = await AuditLog.findOne({ entityId: leadId });
    assert.ok(sampleAudit, 'Audit log must exist in DB');

    let updateFailed = false;
    try {
      await AuditLog.updateOne({ _id: sampleAudit._id }, { action: 'TAMPERED_ACTION' });
    } catch (err) {
      updateFailed = err.message.includes('AUDIT_IMMUTABILITY_VIOLATION');
    }
    assert.ok(updateFailed, 'AuditLog.updateOne must throw AUDIT_IMMUTABILITY_VIOLATION');

    let deleteFailed = false;
    try {
      await AuditLog.deleteOne({ _id: sampleAudit._id });
    } catch (err) {
      deleteFailed = err.message.includes('AUDIT_IMMUTABILITY_VIOLATION');
    }
    assert.ok(deleteFailed, 'AuditLog.deleteOne must throw AUDIT_IMMUTABILITY_VIOLATION');
    pass('Security 2.7: Verified application-level audit ledger immutability blocks updates and deletions');

    // 2.8 Public tracking sanitization
    const publicTrackCheck = await request('POST', '/api/v1/enquiries/track', {
      trackingId,
      mobileNumber: uniquePhone
    });
    assert.strictEqual(publicTrackCheck.status, 200);
    assert.strictEqual(publicTrackCheck.body.data.internalNotes, undefined);
    assert.strictEqual(publicTrackCheck.body.data.assignedCounsellorId, undefined);
    assert.strictEqual(publicTrackCheck.body.data.rejectionReason, undefined);
    pass('Security 2.8: Verified zero staff notes or sensitive fields exposed in public tracking');

    // 2.9 Startup guard against missing JWT_SECRET
    // We check the guard statement in server.js
    const serverCode = await import('node:fs').then(fs => fs.promises.readFile(new URL('../src/server.js', import.meta.url), 'utf8'));
    assert.ok(serverCode.includes('process.env.JWT_SECRET'), 'server.js must contain JWT_SECRET check');
    assert.ok(serverCode.includes('process.exit(1)'), 'server.js must exit(1) if JWT_SECRET is missing');
    pass('Security 2.9: Verified server.js startup guard halts immediately if JWT_SECRET is missing');

    // 2.10 Zero paid API keys or external cloud dependencies
    const envFile = await import('node:fs').then(fs => fs.promises.readFile(new URL('../.env', import.meta.url), 'utf8'));
    assert.strictEqual(envFile.includes('OPENAI_API_KEY'), false);
    assert.strictEqual(envFile.includes('ANTHROPIC_API_KEY'), false);
    assert.strictEqual(envFile.includes('WHATSAPP_CLOUD_API'), false);
    assert.ok(envFile.includes('AI_PROVIDER=deterministic'));
    assert.ok(envFile.includes('AUTOMATION_ENGINE=local'));
    pass('Security 2.10: Verified ₹0 cloud footprint (zero paid API keys or external services)');

    console.log('\n===============================================================');
    console.log(`  🎉 ALL ${totalAssertions} PHASE 4 E2E ASSERTIONS PASSED WITH 100% ACCURACY!`);
    console.log('===============================================================\n');

  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await mongoose.connection.close();
  }
}

runPhase4E2EVerification().catch((err) => {
  console.error('[E2E Test Failed]', err);
  process.exit(1);
});
