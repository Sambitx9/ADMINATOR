import assert from 'node:assert';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { User, College } from '../src/models/index.js';
import { resetLoginRateLimiter } from '../src/middlewares/loginRateLimiter.js';
import { authenticateJWT, requireRoles, enforceCollegeIsolation } from '../src/middlewares/authMiddleware.js';

let server;
let baseUrl;

// Helper for making HTTP requests in tests
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

async function runAuthTests() {
  console.log('\n===============================================================');
  console.log('  ADMINATOR — AUTHENTICATION, RBAC & TENANCY TEST SUITE');
  console.log('===============================================================\n');

  process.env.NODE_ENV = 'test';
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
    // Test Section 1: Password Hashing & Schema Invariants
    // -------------------------------------------------------------
    console.log('[SECTION 1: PASSWORD HASHING & SCHEMA INVARIANTS]');

    const plainPassword = 'TestPassword123!';
    const hash = await User.hashPassword(plainPassword);
    assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'Hash should be valid bcrypt format');
    console.log('  ✓ 1.1 Bcrypt 10-round hashing verified');

    const dummyUser = new User({
      name: 'Test Hash User',
      email: 'testhash@kipt.ac.in',
      passwordHash: hash,
      role: 'COUNSELLOR',
      phone: '9861000000',
      isActive: true
    });

    const isMatch = await dummyUser.comparePassword(plainPassword);
    const isMismatch = await dummyUser.comparePassword('WrongPass');
    assert.strictEqual(isMatch, true, 'comparePassword should return true for correct password');
    assert.strictEqual(isMismatch, false, 'comparePassword should return false for incorrect password');
    console.log('  ✓ 1.2 comparePassword verification passed');

    const jsonUser = dummyUser.toJSON();
    assert.strictEqual(jsonUser.passwordHash, undefined, 'passwordHash must be stripped by toJSON');
    assert.strictEqual(jsonUser.__v, undefined, '__v must be stripped by toJSON');
    console.log('  ✓ 1.3 toJSON sanitization passed');

    // -------------------------------------------------------------
    // Test Section 2: POST /api/v1/auth/login Endpoints
    // -------------------------------------------------------------
    console.log('\n[SECTION 2: LOGIN ENDPOINT AUTHENTICATION]');
    resetLoginRateLimiter();

    // 2.1 Successful login for Counsellor
    const counsellorLogin = await request('POST', '/api/v1/auth/login', {
      email: 'sunita.counsellor@kipt.ac.in',
      password: 'DemoPassword123!'
    });
    assert.strictEqual(counsellorLogin.status, 200, 'Counsellor login should return 200');
    assert.strictEqual(counsellorLogin.body.success, true);
    assert.ok(counsellorLogin.body.data.token, 'Should return JWT token');
    assert.strictEqual(counsellorLogin.body.data.user.role, 'COUNSELLOR');
    assert.strictEqual(counsellorLogin.body.data.user.passwordHash, undefined, 'Never expose passwordHash');
    const counsellorToken = counsellorLogin.body.data.token;
    console.log('  ✓ 2.1 Successful Counsellor Login verified');

    // 2.2 Successful login for College Admin
    const adminLogin = await request('POST', '/api/v1/auth/login', {
      email: 'admin@kipt.ac.in',
      password: 'DemoPassword123!'
    });
    assert.strictEqual(adminLogin.status, 200);
    assert.strictEqual(adminLogin.body.data.user.role, 'COLLEGE_ADMIN');
    const adminToken = adminLogin.body.data.token;
    console.log('  ✓ 2.2 Successful College Admin Login verified');

    // 2.3 Successful login for Platform Admin
    const platformLogin = await request('POST', '/api/v1/auth/login', {
      email: 'platform.admin@adminator.demo',
      password: 'DemoPassword123!'
    });
    assert.strictEqual(platformLogin.status, 200);
    assert.strictEqual(platformLogin.body.data.user.role, 'PLATFORM_ADMIN');
    const platformToken = platformLogin.body.data.token;
    console.log('  ✓ 2.3 Successful Platform Admin Login verified');

    // 2.4 Missing credentials
    const missingCreds = await request('POST', '/api/v1/auth/login', {});
    assert.strictEqual(missingCreds.status, 400);
    assert.strictEqual(missingCreds.body.error.code, 'VALIDATION_ERROR');
    console.log('  ✓ 2.4 Missing input validation passed');

    // 2.5 Invalid email format
    const invalidEmail = await request('POST', '/api/v1/auth/login', {
      email: 'invalid-email-format',
      password: 'SomePassword'
    });
    assert.strictEqual(invalidEmail.status, 400);
    assert.strictEqual(invalidEmail.body.error.code, 'VALIDATION_ERROR');
    console.log('  ✓ 2.5 Invalid email format rejected');

    // 2.6 Wrong password (generic message)
    const wrongPassword = await request('POST', '/api/v1/auth/login', {
      email: 'sunita.counsellor@kipt.ac.in',
      password: 'WrongPassword999!'
    });
    assert.strictEqual(wrongPassword.status, 401);
    assert.strictEqual(wrongPassword.body.error.message, 'Invalid email or password');
    console.log('  ✓ 2.6 Wrong password returned generic 401');

    // 2.7 Non-existent user (identical generic message)
    const nonExistent = await request('POST', '/api/v1/auth/login', {
      email: 'nobody@nowhere.com',
      password: 'SomePassword123!'
    });
    assert.strictEqual(nonExistent.status, 401);
    assert.strictEqual(nonExistent.body.error.message, 'Invalid email or password');
    console.log('  ✓ 2.7 Non-existent account returned identical generic 401 (Anti-enumeration)');

    // 2.8 Deactivated account
    const disabledLogin = await request('POST', '/api/v1/auth/login', {
      email: 'inactive.counsellor@kipt.ac.in',
      password: 'DemoPassword123!'
    });
    assert.strictEqual(disabledLogin.status, 403);
    assert.strictEqual(disabledLogin.body.error.code, 'ACCOUNT_DISABLED');
    console.log('  ✓ 2.8 Deactivated account login blocked (403)');

    // -------------------------------------------------------------
    // Test Section 3: GET /api/v1/auth/me & Token Validation
    // -------------------------------------------------------------
    console.log('\n[SECTION 3: GET /api/v1/auth/me & TOKEN VALIDATION]');

    // 3.1 Missing token
    const noToken = await request('GET', '/api/v1/auth/me');
    assert.strictEqual(noToken.status, 401);
    assert.strictEqual(noToken.body.error.code, 'UNAUTHORIZED');
    console.log('  ✓ 3.1 Missing token rejected (401)');

    // 3.2 Malformed token
    const malformedToken = await request('GET', '/api/v1/auth/me', null, {
      Authorization: 'Bearer this-is-not-a-valid-token'
    });
    assert.strictEqual(malformedToken.status, 401);
    assert.strictEqual(malformedToken.body.error.code, 'INVALID_TOKEN');
    console.log('  ✓ 3.2 Malformed token rejected (401)');

    // 3.3 Expired token
    const expiredToken = jwt.sign(
      { userId: counsellorLogin.body.data.user._id, role: 'COUNSELLOR' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' } // Expired 1 second ago
    );
    const expiredRes = await request('GET', '/api/v1/auth/me', null, {
      Authorization: `Bearer ${expiredToken}`
    });
    assert.strictEqual(expiredRes.status, 401);
    assert.strictEqual(expiredRes.body.error.code, 'TOKEN_EXPIRED');
    console.log('  ✓ 3.3 Expired token rejected (401 TOKEN_EXPIRED)');

    // 3.4 Valid token retrieval
    const meRes = await request('GET', '/api/v1/auth/me', null, {
      Authorization: `Bearer ${counsellorToken}`
    });
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.body.data.user.email, 'sunita.counsellor@kipt.ac.in');
    assert.strictEqual(meRes.body.data.user.passwordHash, undefined);
    console.log('  ✓ 3.4 Valid profile retrieved successfully');

    // -------------------------------------------------------------
    // Test Section 4: Role-Based Authorization Guard (requireRoles)
    // -------------------------------------------------------------
    console.log('\n[SECTION 4: ROLE-BASED ACCESS CONTROL (RBAC)]');

    // 4.1 Counsellor attempting to access admin route
    const counsellorAccess = await request('GET', '/api/v1/auth/test/admin-only', null, {
      Authorization: `Bearer ${counsellorToken}`
    });
    assert.strictEqual(counsellorAccess.status, 403);
    assert.strictEqual(counsellorAccess.body.error.code, 'FORBIDDEN');
    console.log('  ✓ 4.1 Counsellor forbidden from College Admin route (403)');

    // 4.2 College Admin accessing admin route
    const adminAccess = await request('GET', '/api/v1/auth/test/admin-only', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert.strictEqual(adminAccess.status, 200);
    assert.strictEqual(adminAccess.body.success, true);
    console.log('  ✓ 4.2 College Admin granted access to Admin route (200)');

    // 4.3 Platform Admin accessing admin route
    const platformAccess = await request('GET', '/api/v1/auth/test/admin-only', null, {
      Authorization: `Bearer ${platformToken}`
    });
    assert.strictEqual(platformAccess.status, 200);
    assert.strictEqual(platformAccess.body.success, true);
    console.log('  ✓ 4.3 Platform Admin granted access to Admin route (200)');

    // -------------------------------------------------------------
    // Test Section 5: College Tenant Isolation Guard
    // -------------------------------------------------------------
    console.log('\n[SECTION 5: MULTI-TENANT ISOLATION]');

    const kipt = await College.findOne({ code: 'KIPT' });
    const upp = await College.findOne({ code: 'UPP' });
    assert.ok(kipt && upp, 'Colleges must exist');

    // 5.1 KIPT Counsellor accessing KIPT data
    const kiptAccess = await request(
      'GET',
      `/api/v1/auth/test/tenant-isolation?collegeId=${kipt._id.toString()}`,
      null,
      { Authorization: `Bearer ${counsellorToken}` }
    );
    assert.strictEqual(kiptAccess.status, 200);
    assert.strictEqual(kiptAccess.body.tenantCollegeId, kipt._id.toString());
    console.log('  ✓ 5.1 Staff accessing own college data authorized');

    // 5.2 KIPT Counsellor attempting to access UPP data
    const uppIllegalAccess = await request(
      'GET',
      `/api/v1/auth/test/tenant-isolation?collegeId=${upp._id.toString()}`,
      null,
      { Authorization: `Bearer ${counsellorToken}` }
    );
    assert.strictEqual(uppIllegalAccess.status, 403);
    assert.strictEqual(uppIllegalAccess.body.error.code, 'TENANT_ISOLATION_VIOLATION');
    console.log('  ✓ 5.2 Cross-college tenant access strictly blocked (403)');

    // 5.3 Platform Admin accessing UPP data (allowed)
    const platformCrossAccess = await request(
      'GET',
      `/api/v1/auth/test/tenant-isolation?collegeId=${upp._id.toString()}`,
      null,
      { Authorization: `Bearer ${platformToken}` }
    );
    assert.strictEqual(platformCrossAccess.status, 200);
    console.log('  ✓ 5.3 Platform Admin permitted cross-tenant access');

    // -------------------------------------------------------------
    // Test Section 6: In-Memory Login Rate Limiter
    // -------------------------------------------------------------
    console.log('\n[SECTION 6: LOGIN RATE LIMITING (BRUTE-FORCE DEFENSE)]');
    resetLoginRateLimiter();

    // Trigger 5 failed login attempts
    for (let i = 1; i <= 5; i++) {
      const res = await request('POST', '/api/v1/auth/login', {
        email: 'sunita.counsellor@kipt.ac.in',
        password: `BadPassword${i}`
      });
      assert.strictEqual(res.status, 401);
    }

    // 6th attempt should be blocked with 429 Too Many Requests
    const blockedRes = await request('POST', '/api/v1/auth/login', {
      email: 'sunita.counsellor@kipt.ac.in',
      password: 'DemoPassword123!'
    });
    assert.strictEqual(blockedRes.status, 429);
    assert.strictEqual(blockedRes.body.error.code, 'RATE_LIMIT_EXCEEDED');
    assert.ok(blockedRes.headers['retry-after'], 'Should include Retry-After header');
    console.log('  ✓ 6.1 Brute-force rate limiting triggered (429 Rate Limit Exceeded)');

    resetLoginRateLimiter();

    console.log('\n===============================================================');
    console.log('  🎉 ALL 20 AUTH, RBAC & TENANCY TESTS PASSED CLEANLY');
    console.log('===============================================================\n');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failure:', err);
    if (server) server.close();
    process.exit(1);
  }
}

runAuthTests();
