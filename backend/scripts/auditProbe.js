import http from 'node:http';

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
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
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, raw: data });
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

async function probeAllEndpoints() {
  console.log('=== STARTING REVISED API AUDIT PROBE ===\n');
  const results = [];

  const logResult = (id, name, endpoint, statusExpected, statusActual, pass, notes = '') => {
    results.push({ id, name, endpoint, statusExpected, statusActual, pass, notes });
    console.log(`${pass ? '✅' : '❌'} [${id}] ${name} (${endpoint}) -> Expected: ${statusExpected}, Got: ${statusActual} ${notes ? `(${notes})` : ''}`);
  };

  try {
    // 1. Health Endpoint
    const health = await request('GET', '/api/v1/health');
    logResult('API-01', 'Health Check Operational', 'GET /api/v1/health', 200, health.status, health.status === 200 && health.body?.data?.status === 'OPERATIONAL');

    // 2. Colleges List
    const colleges = await request('GET', '/api/v1/colleges');
    const firstCollege = colleges.body?.data?.[0]?.code;
    logResult('API-02', 'Colleges List DRIEMS First', 'GET /api/v1/colleges', 200, colleges.status, colleges.status === 200 && firstCollege === 'DRIEMS', `First college: ${firstCollege}`);

    // 3. Branches List
    const branches = await request('GET', '/api/v1/branches');
    logResult('API-03', 'Branches List', 'GET /api/v1/branches', 200, branches.status, branches.status === 200 && branches.body?.data?.length === 6);

    // 4. Eligibility Check - Valid Profile
    const eligValid = await request('POST', '/api/v1/eligibility/check', {
      academicPathway: 'FIRST_YEAR',
      qualification: {
        category: 'GENERAL',
        aggregatePercentage: 58.5,
        examType: '10TH',
        passedMathAndScience: true
      },
      ageYears: 16
    });
    logResult('API-04', 'Eligibility Check Valid', 'POST /api/v1/eligibility/check', 200, eligValid.status, eligValid.status === 200 && eligValid.body?.data?.verdict === 'ELIGIBLE', `Verdict: ${eligValid.body?.data?.verdict}`);

    // 5. Eligibility Check - Negative Marks
    const eligNeg = await request('POST', '/api/v1/eligibility/check', {
      academicPathway: 'FIRST_YEAR',
      qualification: {
        category: 'GENERAL',
        aggregatePercentage: -10,
        examType: '10TH'
      },
      ageYears: 16
    });
    logResult('API-05', 'Eligibility Negative Marks Handling', 'POST /api/v1/eligibility/check', 200, eligNeg.status, eligNeg.body?.data?.verdict === 'NOT_ELIGIBLE', `Verdict: ${eligNeg.body?.data?.verdict}`);

    // 6. Eligibility Check - Missing Fields
    const eligMissing = await request('POST', '/api/v1/eligibility/check', {});
    logResult('API-06', 'Eligibility Missing Fields Validation', 'POST /api/v1/eligibility/check', 400, eligMissing.status, eligMissing.status === 400, `Got: ${eligMissing.status}`);

    // 7. Chat Message - Baseline
    const chatNorm = await request('POST', '/api/v1/chat/message', {
      sessionId: 'probe-session-1',
      message: 'Hello'
    });
    logResult('API-07', 'Chat Message Baseline', 'POST /api/v1/chat/message', 200, chatNorm.status, chatNorm.status === 200);

    // 8. Chat Message - Missing SessionId
    const chatNoSession = await request('POST', '/api/v1/chat/message', { message: 'Hello' });
    logResult('API-08', 'Chat Missing Session ID', 'POST /api/v1/chat/message', 400, chatNoSession.status, chatNoSession.status === 400);

    // 9. Chat Message - XSS Injection Attempt
    const xssPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
    const chatXss = await request('POST', '/api/v1/chat/message', {
      sessionId: 'probe-session-xss',
      message: xssPayload
    });
    const xssSanitized = !chatXss.body?.data?.reply?.includes('<script>');
    logResult('API-09', 'Chat XSS Input Sanitization', 'POST /api/v1/chat/message', 200, chatXss.status, chatXss.status === 200 && xssSanitized, `Sanitized: ${xssSanitized}`);

    // 10. Chat Message - Empty Text
    const chatEmpty = await request('POST', '/api/v1/chat/message', {
      sessionId: 'probe-session-empty',
      message: '   '
    });
    logResult('API-10', 'Chat Empty Message Rejection', 'POST /api/v1/chat/message', 400, chatEmpty.status, chatEmpty.status === 400, `Got: ${chatEmpty.status}`);

    // 11. Chat History
    const chatHist = await request('GET', '/api/v1/chat/history/probe-session-1');
    logResult('API-11', 'Chat History Retrieval', 'GET /api/v1/chat/history/:id', 200, chatHist.status, chatHist.status === 200 && Array.isArray(chatHist.body?.data?.messages));

    // 12. Chat History - Invalid Session ID
    const chatHistBad = await request('GET', '/api/v1/chat/history/non-existent-session-xyz-999');
    logResult('API-12', 'Chat History Non-Existent Session', 'GET /api/v1/chat/history/:id', 200, chatHistBad.status, chatHistBad.status === 200 && chatHistBad.body?.data?.messages?.length === 0);

    // 13. Enquiry Submission - Valid
    const phoneRandom = '98610' + Math.floor(10000 + Math.random() * 90000);
    const enqValid = await request('POST', '/api/v1/enquiries', {
      fullName: 'Probe Test Student',
      mobileNumber: phoneRandom,
      district: 'Cuttack',
      preferredLanguage: 'en'
    });
    const enqTrackId = enqValid.body?.data?.trackingId;
    logResult('API-13', 'Enquiry Submission Valid', 'POST /api/v1/enquiries', 201, enqValid.status, enqValid.status === 201 && !!enqTrackId, `TrackingId: ${enqTrackId}`);

    // 14. Enquiry Submission - Invalid Phone
    const enqBadPhone = await request('POST', '/api/v1/enquiries', {
      fullName: 'Bad Phone Student',
      mobileNumber: '123456789'
    });
    logResult('API-14', 'Enquiry Bad Phone Format', 'POST /api/v1/enquiries', 400, enqBadPhone.status, enqBadPhone.status === 400);

    // 15. Enquiry Tracking - Valid Dual Key
    const trackValid = await request('POST', '/api/v1/enquiries/track', {
      trackingId: enqTrackId,
      mobileNumber: phoneRandom
    });
    logResult('API-15', 'Enquiry Dual-Key Tracking Valid', 'POST /api/v1/enquiries/track', 200, trackValid.status, trackValid.status === 200 && trackValid.body?.data?.trackingId === enqTrackId);

    // 16. Enquiry Tracking - Mismatched Phone
    const trackBadPhone = await request('POST', '/api/v1/enquiries/track', {
      trackingId: enqTrackId,
      mobileNumber: '9999999999'
    });
    logResult('API-16', 'Enquiry Tracking Mismatch Phone (Anti-Enumeration)', 'POST /api/v1/enquiries/track', 404, trackBadPhone.status, trackBadPhone.status === 404);

    // 17. Enquiry Tracking - NoSQL Injection
    const trackNoSql = await request('POST', '/api/v1/enquiries/track', {
      trackingId: { $ne: null },
      mobileNumber: { $gt: "" }
    });
    logResult('API-17', 'Enquiry Tracking NoSQL Injection Defense', 'POST /api/v1/enquiries/track', 400, trackNoSql.status, [400, 404].includes(trackNoSql.status));

    // 18. Auth - Login Valid (DRIEMS Admin)
    const loginDriems = await request('POST', '/api/v1/auth/login', {
      email: 'admin@driems.ac.in',
      password: 'DemoPassword123!'
    });
    const tokenDriems = loginDriems.body?.data?.token;
    logResult('API-18', 'Staff Login DRIEMS Admin', 'POST /api/v1/auth/login', 200, loginDriems.status, loginDriems.status === 200 && !!tokenDriems);

    // 19. Auth - Login Valid (DRIEMS Counsellor)
    const loginCouns = await request('POST', '/api/v1/auth/login', {
      email: 'counsellor@driems.ac.in',
      password: 'DemoPassword123!'
    });
    const tokenCouns = loginCouns.body?.data?.token;
    logResult('API-19', 'Staff Login DRIEMS Counsellor', 'POST /api/v1/auth/login', 200, loginCouns.status, loginCouns.status === 200 && !!tokenCouns);

    // 20. Auth - Login Valid (KIPT Admin)
    const loginKipt = await request('POST', '/api/v1/auth/login', {
      email: 'admin@kipt.ac.in',
      password: 'DemoPassword123!'
    });
    const tokenKipt = loginKipt.body?.data?.token;
    logResult('API-20', 'Staff Login KIPT Admin', 'POST /api/v1/auth/login', 200, loginKipt.status, loginKipt.status === 200 && !!tokenKipt);

    // 21. Auth - Login Bad Password
    const loginBadPass = await request('POST', '/api/v1/auth/login', {
      email: 'admin@driems.ac.in',
      password: 'WrongPassword123!'
    });
    logResult('API-21', 'Staff Login Bad Password', 'POST /api/v1/auth/login', 401, loginBadPass.status, loginBadPass.status === 401);

    // 22. Auth - GET /api/v1/auth/me (Valid)
    const meValid = await request('GET', '/api/v1/auth/me', null, { Authorization: `Bearer ${tokenDriems}` });
    logResult('API-22', 'Auth Me Endpoint Valid', 'GET /api/v1/auth/me', 200, meValid.status, meValid.status === 200 && meValid.body?.data?.user?.email === 'admin@driems.ac.in');

    // 23. Auth - GET /api/v1/auth/me (Missing Token)
    const meNoToken = await request('GET', '/api/v1/auth/me');
    logResult('API-23', 'Auth Me Missing Token', 'GET /api/v1/auth/me', 401, meNoToken.status, meNoToken.status === 401);

    // 24. Auth - GET /api/v1/auth/me (Forged Token)
    const meBadToken = await request('GET', '/api/v1/auth/me', null, { Authorization: 'Bearer forged.jwt.token' });
    logResult('API-24', 'Auth Me Forged Token', 'GET /api/v1/auth/me', 401, meBadToken.status, meBadToken.status === 401);

    // 25. CRM Leads - List Leads (DRIEMS Admin)
    const leadsDriems = await request('GET', '/api/v1/crm/leads', null, { Authorization: `Bearer ${tokenDriems}` });
    const leadSample = leadsDriems.body?.data?.leads?.[0];
    const leadId = leadSample?._id;
    logResult('API-25', 'CRM Leads List (DRIEMS Admin)', 'GET /api/v1/crm/leads', 200, leadsDriems.status, leadsDriems.status === 200 && Array.isArray(leadsDriems.body?.data?.leads));

    // 26. CRM Leads - Details
    if (leadId) {
      const leadDetail = await request('GET', `/api/v1/crm/leads/${leadId}`, null, { Authorization: `Bearer ${tokenDriems}` });
      logResult('API-26', 'CRM Lead Details', `GET /api/v1/crm/leads/:id`, 200, leadDetail.status, leadDetail.status === 200 && leadDetail.body?.data?.enquiry?._id === leadId);

      // 27. CRM Enquiries - Add Note
      const addNote = await request('POST', `/api/v1/crm/enquiries/${leadId}/notes`, { text: 'Audit verification test note' }, { Authorization: `Bearer ${tokenDriems}` });
      logResult('API-27', 'CRM Add Internal Note', `POST /api/v1/crm/enquiries/:id/notes`, 201, addNote.status, addNote.status === 201);

      // 28. CRM Enquiries - Invalid Status Transition
      const badStatus = await request('PATCH', `/api/v1/crm/enquiries/${leadId}/status`, { status: 'INVALID_STATUS_CODE' }, { Authorization: `Bearer ${tokenDriems}` });
      logResult('API-28', 'CRM Invalid Status Transition', `PATCH /api/v1/crm/enquiries/:id/status`, 400, badStatus.status, badStatus.status === 400);

      // 29. CRM Leads - Counsellor RBAC Reassign Block
      const counsAssign = await request('POST', `/api/v1/crm/leads/${leadId}/assign`, { counsellorId: '6af9c75aaa68bd155aa623a8' }, { Authorization: `Bearer ${tokenCouns}` });
      logResult('API-29', 'CRM Counsellor Reassign Block (RBAC)', `POST /api/v1/crm/leads/:id/assign`, 403, counsAssign.status, counsAssign.status === 403);
    }

    // 30. CRM Metrics
    const metricsRes = await request('GET', '/api/v1/crm/metrics', null, { Authorization: `Bearer ${tokenDriems}` });
    logResult('API-30', 'CRM Metrics Overview', 'GET /api/v1/crm/metrics', 200, metricsRes.status, metricsRes.status === 200 && typeof metricsRes.body?.data?.counts?.total === 'number');

    // 31. CRM Audit Logs - Admin Access Allowed
    const auditRes = await request('GET', '/api/v1/crm/audit-logs', null, { Authorization: `Bearer ${tokenDriems}` });
    logResult('API-31', 'CRM Audit Logs (Admin Access)', 'GET /api/v1/crm/audit-logs', 200, auditRes.status, auditRes.status === 200 && Array.isArray(auditRes.body?.data?.logs));

    // 32. CRM Audit Logs - Counsellor Access Blocked
    const auditBlock = await request('GET', '/api/v1/crm/audit-logs', null, { Authorization: `Bearer ${tokenCouns}` });
    logResult('API-32', 'CRM Audit Logs (Counsellor Blocked)', 'GET /api/v1/crm/audit-logs', 403, auditBlock.status, auditBlock.status === 403);

    // 33. CRM Counsellors List
    const staffRes = await request('GET', '/api/v1/crm/counsellors', null, { Authorization: `Bearer ${tokenDriems}` });
    logResult('API-33', 'CRM Counsellors Directory', 'GET /api/v1/crm/counsellors', 200, staffRes.status, staffRes.status === 200 && Array.isArray(staffRes.body?.data?.counsellors));

    // 34. CRM Students Roster - DRIEMS 65 Records
    const studentsRes = await request('GET', '/api/v1/crm/students?isRoster=true&limit=100', null, { Authorization: `Bearer ${tokenDriems}` });
    const rosterCount = studentsRes.body?.data?.pagination?.totalStudents;
    logResult('API-34', 'CRM Student Roster (DRIEMS 65 Records)', 'GET /api/v1/crm/students', 200, studentsRes.status, studentsRes.status === 200 && rosterCount === 65, `Found: ${rosterCount}`);

    // 35. CRM Students Roster - Multi-Tenant Isolation
    const kiptStudents = await request('GET', '/api/v1/crm/students?isRoster=true', null, { Authorization: `Bearer ${tokenKipt}` });
    const kiptCount = kiptStudents.body?.data?.pagination?.totalStudents;
    logResult('API-35', 'CRM Multi-Tenant Isolation (KIPT sees 0 DRIEMS records)', 'GET /api/v1/crm/students', 200, kiptStudents.status, kiptStudents.status === 200 && kiptCount === 0, `KIPT count: ${kiptCount}`);

    console.log('\n=== API AUDIT PROBE COMPLETED ===');
    const total = results.length;
    const passed = results.filter(r => r.pass).length;
    console.log(`Summary: ${passed}/${total} Probes Passed (${((passed/total)*100).toFixed(1)}%)`);

  } catch (err) {
    console.error('Fatal probe error:', err);
  }
}

probeAllEndpoints();
