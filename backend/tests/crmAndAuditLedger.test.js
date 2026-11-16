import assert from 'node:assert';
import http from 'node:http';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User, College, Student, Enquiry, AuditLog } from '../src/models/index.js';
import { generateTrackingId } from '../src/utils/idGenerator.js';

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

    req.error = reject;
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runCRMTests() {
  console.log('\n===============================================================');
  console.log('  ADMINATOR — CRM LEAD MANAGEMENT & AUDIT LEDGER TEST SUITE');
  console.log('===============================================================\n');

  await connectDB();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[Test Server] Running on ${baseUrl}`);
      resolve();
    });
  });

  try {
    // -------------------------------------------------------------
    // Setup: Retrieve Colleges & Log in Seeded Users
    // -------------------------------------------------------------
    console.log('[SETUP: AUTHENTICATING TEST ACTORS]');
    const kipt = await College.findOne({ code: 'KIPT' });
    const upp = await College.findOne({ code: 'UPP' });
    assert.ok(kipt && upp, 'KIPT and UPP colleges must exist');

    // Login KIPT Counsellor
    const kiptCounsellorLogin = await request('POST', '/api/v1/auth/login', {
      email: 'sunita.counsellor@kipt.ac.in',
      password: 'DemoPassword123!'
    });
    assert.strictEqual(kiptCounsellorLogin.status, 200);
    const kiptCounsellorToken = kiptCounsellorLogin.body.data.token;
    const kiptCounsellorUser = kiptCounsellorLogin.body.data.user;

    // Login KIPT Admin
    const kiptAdminLogin = await request('POST', '/api/v1/auth/login', {
      email: 'admin@kipt.ac.in',
      password: 'DemoPassword123!'
    });
    assert.strictEqual(kiptAdminLogin.status, 200);
    const kiptAdminToken = kiptAdminLogin.body.data.token;

    // Login UPP Counsellor
    const uppCounsellorLogin = await request('POST', '/api/v1/auth/login', {
      email: 'bikash.counsellor@upp.ac.in',
      password: 'DemoPassword123!'
    });
    assert.strictEqual(uppCounsellorLogin.status, 200);
    const uppCounsellorToken = uppCounsellorLogin.body.data.token;
    const uppCounsellorUser = uppCounsellorLogin.body.data.user;

    // Login Platform Admin
    const platformAdminLogin = await request('POST', '/api/v1/auth/login', {
      email: 'platform.admin@adminator.demo',
      password: 'DemoPassword123!'
    });
    assert.strictEqual(platformAdminLogin.status, 200);
    const platformAdminToken = platformAdminLogin.body.data.token;

    // Find Inactive Counsellor
    const inactiveCounsellor = await User.findOne({ email: 'inactive.counsellor@kipt.ac.in' });
    assert.ok(inactiveCounsellor, 'Inactive counsellor must exist');

    // Create Fresh Test Student & Enquiries with unique test mobile numbers
    const testKiptMobile = '98' + Math.floor(10000000 + Math.random() * 90000000).toString();
    const testUppMobile = '98' + Math.floor(10000000 + Math.random() * 90000000).toString();

    const testStudentKipt = await Student.create({
      fullName: 'Aarav Pattnaik',
      mobileNumber: testKiptMobile,
      email: 'aarav@test.demo',
      district: 'Khordha',
      state: 'Odisha',
      category: 'GENERAL'
    });

    const testEnquiryKipt = await Enquiry.create({
      trackingId: generateTrackingId(),
      studentId: testStudentKipt._id,
      collegeId: kipt._id,
      status: 'NEW',
      priority: 'HOT',
      notes: [{ author: 'STUDENT_PORTAL', text: 'Initial registration' }],
      isDemo: true
    });

    const testStudentUpp = await Student.create({
      fullName: 'Priyanka Senapati',
      mobileNumber: testUppMobile,
      district: 'Cuttack',
      state: 'Odisha',
      category: 'OBC'
    });

    const testEnquiryUpp = await Enquiry.create({
      trackingId: generateTrackingId(),
      studentId: testStudentUpp._id,
      collegeId: upp._id,
      status: 'NEW',
      priority: 'WARM',
      notes: [{ author: 'STUDENT_PORTAL', text: 'Interested in Civil' }],
      isDemo: true
    });

    console.log('  ✓ Test actors and seed enquiries ready');

    // -------------------------------------------------------------
    // Test 1: Authenticated Lead Listing
    // -------------------------------------------------------------
    console.log('\n[TEST 1: AUTHENTICATED LEAD LISTING]');
    const listRes = await request('GET', '/api/v1/crm/leads', null, {
      Authorization: `Bearer ${kiptAdminToken}`
    });
    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listRes.body.success, true);
    assert.ok(Array.isArray(listRes.body.data.leads));
    assert.ok(listRes.body.data.leads.length > 0);
    console.log(`  ✓ 1. Authenticated lead listing returned ${listRes.body.data.leads.length} leads`);

    // -------------------------------------------------------------
    // Test 2: Unauthenticated Access Rejection
    // -------------------------------------------------------------
    console.log('\n[TEST 2: UNAUTHENTICATED ACCESS REJECTION]');
    const unauthRes = await request('GET', '/api/v1/crm/leads');
    assert.strictEqual(unauthRes.status, 401);
    assert.strictEqual(unauthRes.body.error.code, 'UNAUTHORIZED');
    console.log('  ✓ 2. Unauthenticated request rejected (401)');

    // -------------------------------------------------------------
    // Test 3: Search and Filtering
    // -------------------------------------------------------------
    console.log('\n[TEST 3: SEARCH AND FILTERING]');
    // 3.1 Search by student name
    const searchNameRes = await request(
      'GET',
      '/api/v1/crm/leads?search=Aarav',
      null,
      { Authorization: `Bearer ${kiptAdminToken}` }
    );
    assert.strictEqual(searchNameRes.status, 200);
    assert.ok(searchNameRes.body.data.leads.some((l) => l.studentId?.fullName === 'Aarav Pattnaik'));
    console.log('  ✓ 3.1 Search by student name passed');

    // 3.2 Search by tracking ID
    const searchTrackingRes = await request(
      'GET',
      `/api/v1/crm/leads?search=${testEnquiryKipt.trackingId}`,
      null,
      { Authorization: `Bearer ${kiptAdminToken}` }
    );
    assert.strictEqual(searchTrackingRes.status, 200);
    assert.strictEqual(searchTrackingRes.body.data.leads[0].trackingId, testEnquiryKipt.trackingId);
    console.log('  ✓ 3.2 Search by tracking ID passed');

    // 3.3 Search by mobile number
    const searchPhoneRes = await request(
      'GET',
      `/api/v1/crm/leads?search=${testStudentKipt.mobileNumber}`,
      null,
      { Authorization: `Bearer ${kiptAdminToken}` }
    );
    assert.strictEqual(searchPhoneRes.status, 200);
    assert.strictEqual(searchPhoneRes.body.data.leads[0].studentId.mobileNumber, testStudentKipt.mobileNumber);
    console.log('  ✓ 3.3 Search by mobile number passed');

    // 3.4 Status and Priority filtering
    const statusFilterRes = await request(
      'GET',
      '/api/v1/crm/leads?status=NEW&priority=HOT',
      null,
      { Authorization: `Bearer ${kiptAdminToken}` }
    );
    assert.strictEqual(statusFilterRes.status, 200);
    assert.ok(statusFilterRes.body.data.leads.every((l) => l.status === 'NEW' && l.priority === 'HOT'));
    console.log('  ✓ 3.4 Status and Priority filtering passed');

    // -------------------------------------------------------------
    // Test 4: Pagination & Metadata
    // -------------------------------------------------------------
    console.log('\n[TEST 4: PAGINATION]');
    const pageRes = await request(
      'GET',
      '/api/v1/crm/leads?page=1&limit=1',
      null,
      { Authorization: `Bearer ${kiptAdminToken}` }
    );
    assert.strictEqual(pageRes.status, 200);
    assert.strictEqual(pageRes.body.data.leads.length, 1);
    assert.strictEqual(pageRes.body.data.pagination.page, 1);
    assert.strictEqual(pageRes.body.data.pagination.limit, 1);
    assert.ok(pageRes.body.data.pagination.totalLeads >= 1);
    console.log('  ✓ 4. Pagination limits and metadata verified');

    // -------------------------------------------------------------
    // Test 5: Lead Detail Authorization
    // -------------------------------------------------------------
    console.log('\n[TEST 5: LEAD DETAIL AUTHORIZATION]');
    const detailRes = await request(
      'GET',
      `/api/v1/crm/leads/${testEnquiryKipt._id}`,
      null,
      { Authorization: `Bearer ${kiptAdminToken}` }
    );
    assert.strictEqual(detailRes.status, 200);
    assert.strictEqual(detailRes.body.data.enquiry.trackingId, testEnquiryKipt.trackingId);
    assert.strictEqual(detailRes.body.data.enquiry.studentId.fullName, 'Aarav Pattnaik');
    assert.strictEqual(detailRes.body.data.enquiry.collegeId.code, 'KIPT');
    console.log('  ✓ 5. Authorized lead detail populated cleanly');

    // -------------------------------------------------------------
    // Test 6: Counsellor Assignment
    // -------------------------------------------------------------
    console.log('\n[TEST 6: COUNSELLOR ASSIGNMENT]');
    const assignRes = await request(
      'POST',
      `/api/v1/crm/leads/${testEnquiryKipt._id}/assign`,
      { counsellorId: kiptCounsellorUser._id },
      { Authorization: `Bearer ${kiptAdminToken}` }
    );
    assert.strictEqual(assignRes.status, 200);
    assert.strictEqual(assignRes.body.success, true);
    assert.strictEqual(assignRes.body.data.enquiry.assignedCounsellorId._id, kiptCounsellorUser._id);
    assert.strictEqual(assignRes.body.data.enquiry.status, 'ASSIGNED');
    console.log('  ✓ 6. Lead successfully assigned to KIPT counsellor and status auto-advanced to ASSIGNED');

    // -------------------------------------------------------------
    // Test 7: Assignment to Inactive Counsellor Rejection
    // -------------------------------------------------------------
    console.log('\n[TEST 7: INACTIVE COUNSELLOR ASSIGNMENT REJECTION]');
    const inactiveAssignRes = await request(
      'POST',
      `/api/v1/crm/leads/${testEnquiryKipt._id}/assign`,
      { counsellorId: inactiveCounsellor._id.toString() },
      { Authorization: `Bearer ${kiptAdminToken}` }
    );
    assert.strictEqual(inactiveAssignRes.status, 400);
    assert.strictEqual(inactiveAssignRes.body.error.code, 'COUNSELLOR_INACTIVE');
    console.log('  ✓ 7. Assignment to deactivated counsellor rejected (400 COUNSELLOR_INACTIVE)');

    // -------------------------------------------------------------
    // Test 8: Cross-College Assignment Rejection
    // -------------------------------------------------------------
    console.log('\n[TEST 8: CROSS-COLLEGE ASSIGNMENT REJECTION]');
    const crossAssignRes = await request(
      'POST',
      `/api/v1/crm/leads/${testEnquiryKipt._id}/assign`,
      { counsellorId: uppCounsellorUser._id },
      { Authorization: `Bearer ${kiptAdminToken}` }
    );
    assert.strictEqual(crossAssignRes.status, 400);
    assert.strictEqual(crossAssignRes.body.error.code, 'CROSS_COLLEGE_ASSIGNMENT_FORBIDDEN');
    console.log('  ✓ 8. Cross-college counsellor assignment rejected (400 CROSS_COLLEGE_ASSIGNMENT_FORBIDDEN)');

    // -------------------------------------------------------------
    // Test 9: Valid Status Transition (ASSIGNED -> CONTACTED -> VERIFIED)
    // -------------------------------------------------------------
    console.log('\n[TEST 9: VALID STATUS TRANSITION]');
    const contactedRes = await request(
      'PATCH',
      `/api/v1/crm/enquiries/${testEnquiryKipt._id}/status`,
      { status: 'CONTACTED', reason: 'Called parent and student, verified admission interest' },
      { Authorization: `Bearer ${kiptCounsellorToken}` }
    );
    assert.strictEqual(contactedRes.status, 200);
    assert.strictEqual(contactedRes.body.data.currentStatus, 'CONTACTED');
    assert.strictEqual(contactedRes.body.data.previousStatus, 'ASSIGNED');
    console.log('  ✓ 9.1 Transition ASSIGNED -> CONTACTED succeeded');

    const verifiedRes = await request(
      'PATCH',
      `/api/v1/crm/enquiries/${testEnquiryKipt._id}/status`,
      { status: 'VERIFIED', reason: '10th mark sheet and resident certificate verified' },
      { Authorization: `Bearer ${kiptCounsellorToken}` }
    );
    assert.strictEqual(verifiedRes.status, 200);
    assert.strictEqual(verifiedRes.body.data.currentStatus, 'VERIFIED');
    console.log('  ✓ 9.2 Transition CONTACTED -> VERIFIED succeeded');

    // -------------------------------------------------------------
    // Test 10: Invalid Status Transition Rejection
    // -------------------------------------------------------------
    console.log('\n[TEST 10: INVALID STATUS TRANSITION]');
    // Attempt invalid jump from VERIFIED to ASSIGNED (not in state machine)
    const invalidJumpRes = await request(
      'PATCH',
      `/api/v1/crm/enquiries/${testEnquiryKipt._id}/status`,
      { status: 'ASSIGNED' },
      { Authorization: `Bearer ${kiptCounsellorToken}` }
    );
    assert.strictEqual(invalidJumpRes.status, 400);
    assert.strictEqual(invalidJumpRes.body.error.code, 'INVALID_STATUS_TRANSITION');
    console.log('  ✓ 10.1 Invalid state jump VERIFIED -> ASSIGNED rejected');

    // Attempt rejection without reason
    const noReasonRejectRes = await request(
      'PATCH',
      `/api/v1/crm/enquiries/${testEnquiryKipt._id}/status`,
      { status: 'REJECTED' },
      { Authorization: `Bearer ${kiptCounsellorToken}` }
    );
    assert.strictEqual(noReasonRejectRes.status, 400);
    assert.strictEqual(noReasonRejectRes.body.error.code, 'REJECTION_REASON_REQUIRED');
    console.log('  ✓ 10.2 Rejection without mandatory reason rejected (400)');

    // -------------------------------------------------------------
    // Test 11: Status History & Audit Entry Verification
    // -------------------------------------------------------------
    console.log('\n[TEST 11: STATUS HISTORY & AUDIT LEDGER ENTRY]');
    const reloadedEnquiry = await Enquiry.findById(testEnquiryKipt._id);
    assert.ok(reloadedEnquiry.statusHistory.length >= 3);
    const lastHistory = reloadedEnquiry.statusHistory[reloadedEnquiry.statusHistory.length - 1];
    assert.strictEqual(lastHistory.toStatus, 'VERIFIED');
    assert.strictEqual(lastHistory.fromStatus, 'CONTACTED');
    console.log('  ✓ 11.1 Enquiry statusHistory accurately recorded all lifecycle steps');

    const auditEntry = await AuditLog.findOne({
      entityId: testEnquiryKipt._id,
      action: 'STATUS_CHANGED',
      newValue: 'VERIFIED'
    });
    assert.ok(auditEntry, 'Audit log record must exist');
    assert.strictEqual(auditEntry.actorRole, 'COUNSELLOR');
    assert.strictEqual(auditEntry.previousValue, 'CONTACTED');
    assert.strictEqual(auditEntry.newValue, 'VERIFIED');
    console.log('  ✓ 11.2 AuditLog collection received matching immutable audit record');

    // -------------------------------------------------------------
    // Test 12: Internal Note Creation
    // -------------------------------------------------------------
    console.log('\n[TEST 12: INTERNAL NOTE CREATION]');
    const addNoteRes = await request(
      'POST',
      `/api/v1/crm/enquiries/${testEnquiryKipt._id}/notes`,
      { text: 'Parent requested hostel brochure and fee installment plan.' },
      { Authorization: `Bearer ${kiptCounsellorToken}` }
    );
    assert.strictEqual(addNoteRes.status, 201);
    assert.strictEqual(addNoteRes.body.success, true);
    assert.strictEqual(addNoteRes.body.data.note.authorRole, 'COUNSELLOR');
    console.log('  ✓ 12. Internal counsellor note created with author and timestamp');

    // -------------------------------------------------------------
    // Test 13: Internal Note Access Control
    // -------------------------------------------------------------
    console.log('\n[TEST 13: INTERNAL NOTE ACCESS CONTROL]');
    const getNotesRes = await request(
      'GET',
      `/api/v1/crm/enquiries/${testEnquiryKipt._id}/notes`,
      null,
      { Authorization: `Bearer ${kiptCounsellorToken}` }
    );
    assert.strictEqual(getNotesRes.status, 200);
    assert.ok(Array.isArray(getNotesRes.body.data.notes));
    assert.ok(getNotesRes.body.data.notes.some((n) => n.text.includes('installment plan')));
    console.log('  ✓ 13. Authorized staff retrieved confidential internal notes');

    // -------------------------------------------------------------
    // Test 14: Student Tracking Endpoint Cannot Expose Internal Notes
    // -------------------------------------------------------------
    console.log('\n[TEST 14: ZERO DATA LEAKAGE TO STUDENT TRACKING]');
    const studentTrackRes = await request('POST', '/api/v1/enquiries/track', {
      trackingId: testEnquiryKipt.trackingId,
      mobileNumber: testStudentKipt.mobileNumber
    });
    assert.strictEqual(studentTrackRes.status, 200);
    const trackData = studentTrackRes.body.data;
    assert.strictEqual(trackData.internalNotes, undefined, 'Must not expose internalNotes');
    // Ensure that none of the public remarks contain the confidential counsellor note
    const leakedNote = (trackData.notes || []).find((n) => n.text.includes('installment plan'));
    assert.strictEqual(leakedNote, undefined, 'Confidential counsellor note must never leak into student tracking response');
    console.log('  ✓ 14. Student tracking endpoint verified 100% leak-free (Zero internal notes exposed)');

    // -------------------------------------------------------------
    // Test 15: Immutability of Audit Records
    // -------------------------------------------------------------
    console.log('\n[TEST 15: AUDIT LOG IMMUTABILITY]');
    let mutationCaught = false;
    try {
      await AuditLog.updateOne({ _id: auditEntry._id }, { $set: { newValue: 'HACKED' } });
    } catch (err) {
      if (err.message.includes('AUDIT_IMMUTABILITY_VIOLATION')) {
        mutationCaught = true;
      }
    }
    assert.strictEqual(mutationCaught, true, 'Audit log update must be rejected by Mongoose immutability hook');

    let deletionCaught = false;
    try {
      await AuditLog.deleteOne({ _id: auditEntry._id });
    } catch (err) {
      if (err.message.includes('AUDIT_IMMUTABILITY_VIOLATION')) {
        deletionCaught = true;
      }
    }
    assert.strictEqual(deletionCaught, true, 'Audit log delete must be rejected by Mongoose immutability hook');
    console.log('  ✓ 15. AuditLog append-only immutability enforced (Update and Delete blocked)');

    // -------------------------------------------------------------
    // Test 16: Platform Admin Cross-Tenant Permissions
    // -------------------------------------------------------------
    console.log('\n[TEST 16: PLATFORM ADMIN CROSS-TENANT ACCESS]');
    // Platform Admin viewing KIPT lead
    const platKiptRes = await request(
      'GET',
      `/api/v1/crm/leads/${testEnquiryKipt._id}`,
      null,
      { Authorization: `Bearer ${platformAdminToken}` }
    );
    assert.strictEqual(platKiptRes.status, 200);

    // Platform Admin viewing UPP lead
    const platUppRes = await request(
      'GET',
      `/api/v1/crm/leads/${testEnquiryUpp._id}`,
      null,
      { Authorization: `Bearer ${platformAdminToken}` }
    );
    assert.strictEqual(platUppRes.status, 200);

    // Platform Admin querying cross-tenant audit logs
    const platAuditRes = await request(
      'GET',
      '/api/v1/crm/audit-logs',
      null,
      { Authorization: `Bearer ${platformAdminToken}` }
    );
    assert.strictEqual(platAuditRes.status, 200);
    assert.ok(platAuditRes.body.data.logs.length > 0);
    console.log('  ✓ 16. Platform Admin cross-tenant privileges verified across institutions');

    // -------------------------------------------------------------
    // Test 17: College Admin Tenant Restrictions
    // -------------------------------------------------------------
    console.log('\n[TEST 17: COLLEGE ADMIN TENANT RESTRICTIONS]');
    // KIPT Admin attempting to view UPP lead
    const illegalViewRes = await request(
      'GET',
      `/api/v1/crm/leads/${testEnquiryUpp._id}`,
      null,
      { Authorization: `Bearer ${kiptAdminToken}` }
    );
    assert.strictEqual(illegalViewRes.status, 403);
    assert.strictEqual(illegalViewRes.body.error.code, 'TENANT_ISOLATION_VIOLATION');
    console.log('  ✓ 17.1 Cross-college lead inspection blocked (403 TENANT_ISOLATION_VIOLATION)');

    // KIPT Admin attempting to update status of UPP lead
    const illegalStatusRes = await request(
      'PATCH',
      `/api/v1/crm/enquiries/${testEnquiryUpp._id}/status`,
      { status: 'CONTACTED' },
      { Authorization: `Bearer ${kiptAdminToken}` }
    );
    assert.strictEqual(illegalStatusRes.status, 403);
    assert.strictEqual(illegalStatusRes.body.error.code, 'TENANT_ISOLATION_VIOLATION');
    console.log('  ✓ 17.2 Cross-college status mutation blocked (403 TENANT_ISOLATION_VIOLATION)');

    // -------------------------------------------------------------
    // Test 18: Counsellor Access Restrictions
    // -------------------------------------------------------------
    console.log('\n[TEST 18: COUNSELLOR ACCESS RESTRICTIONS]');
    // Counsellor attempting to assign an enquiry (Admin only)
    const counsellorIllegalAssign = await request(
      'POST',
      `/api/v1/crm/leads/${testEnquiryKipt._id}/assign`,
      { counsellorId: kiptCounsellorUser._id },
      { Authorization: `Bearer ${kiptCounsellorToken}` }
    );
    assert.strictEqual(counsellorIllegalAssign.status, 403);
    assert.strictEqual(counsellorIllegalAssign.body.error.code, 'FORBIDDEN');
    console.log('  ✓ 18.1 Counsellor forbidden from assigning leads (403 FORBIDDEN)');

    // Counsellor attempting to view audit logs (Admin only)
    const counsellorIllegalAudit = await request(
      'GET',
      '/api/v1/crm/audit-logs',
      null,
      { Authorization: `Bearer ${kiptCounsellorToken}` }
    );
    assert.strictEqual(counsellorIllegalAudit.status, 403);
    assert.strictEqual(counsellorIllegalAudit.body.error.code, 'FORBIDDEN');
    console.log('  ✓ 18.2 Counsellor forbidden from viewing audit logs (403 FORBIDDEN)');

    console.log('\n===============================================================');
    console.log('  🎉 ALL 18 CRM LEAD MANAGEMENT & AUDIT TESTS PASSED CLEANLY');
    console.log('===============================================================\n');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failure:', err);
    if (server) server.close();
    process.exit(1);
  }
}

runCRMTests();
