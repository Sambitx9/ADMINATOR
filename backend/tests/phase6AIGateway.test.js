/**
 * ADMINATOR — Phase 6 AI Gateway & Fault Tolerance Test Suite
 * 
 * Verifies:
 *   1. IAIGateway Interface Contract & Subclassing
 *   2. Sliding Window Rate Limiter (15 RPM Gemini Free Tier Constraint)
 *   3. Circuit Breaker State Machine (CLOSED -> OPEN -> HALF_OPEN -> CLOSED)
 *   4. Student PII Sanitization & Grounding Constraints
 *   5. Automatic Fallback Matrix (Missing Key, Timeout, Network Error, Rate Limit, Invalid Output)
 *   6. Multilingual Preservation across English, Hindi, and Odia
 *   7. HTTP Endpoints: /api/v1/chat/message and /api/v1/chat/ai-status
 *   8. Data Integrity: All 65 DRIEMS Student Records Intact
 */

import assert from 'node:assert';
import http from 'node:http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../src/app.js';
import {
  IAIGateway,
  CircuitBreaker,
  CircuitState,
  RateLimiter,
  GeminiAIGateway,
  AIGatewayManager,
  aiGatewayManager
} from '../src/ai/index.js';
import { Student, Conversation, College } from '../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/adminator_demo';

console.log('======================================================================');
console.log('  ADMINATOR — PHASE 6 AI GATEWAY & FAULT-TOLERANCE VERIFICATION SUITE');
console.log('======================================================================');

async function runPhase6Tests() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB:', MONGODB_URI);

  const server = http.createServer(app);
  let baseUrl;

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`✅ Test server running on ${baseUrl}`);
      resolve();
    });
  });

  const request = async (method, endpoint, body = null, headers = {}) => {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', ...headers }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${baseUrl}${endpoint}`, opts);
    let json = null;
    try {
      json = await res.json();
    } catch (e) {}
    return { status: res.status, ok: res.ok, data: json };
  };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: IAIGateway Interface Contract
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 1: IAIGateway Interface Contract ---');
    assert.throws(
      () => new IAIGateway(),
      /Cannot construct IAIGateway directly/,
      'Direct instantiation of IAIGateway must throw TypeError'
    );
    console.log('  ✓ IAIGateway abstract contract prevents direct instantiation');

    class MockEmptyGateway extends IAIGateway {}
    const mockEmpty = new MockEmptyGateway();
    assert.throws(() => mockEmpty.isHealthy(), /must be implemented by subclass/);
    assert.throws(() => mockEmpty.getStatus(), /must be implemented by subclass/);
    console.log('  ✓ Subclasses must implement contract methods');

    // -------------------------------------------------------------------------
    // TEST 2: Sliding Window Rate Limiter (15 RPM Free Tier Constraint)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Sliding Window Rate Limiter (15 RPM) ---');
    const limiter = new RateLimiter({ maxRequests: 15, windowMs: 60000 });
    
    // Acquire 15 requests
    for (let i = 1; i <= 15; i++) {
      const check = limiter.tryAcquire();
      assert.strictEqual(check.allowed, true, `Request #${i} must be allowed`);
      assert.strictEqual(check.remaining, 15 - i, `Remaining quota must be ${15 - i}`);
    }
    console.log('  ✓ Exactly 15 requests allowed within 60-second window');

    // 16th request must be denied
    const blocked = limiter.tryAcquire();
    assert.strictEqual(blocked.allowed, false, '16th request must be blocked');
    assert.strictEqual(blocked.remaining, 0, 'Remaining quota must be 0');
    assert.ok(blocked.resetMs > 0, 'Reset timestamp must be positive');
    console.log(`  ✓ 16th request rejected with resetMs: ${blocked.resetMs}ms`);

    // Reset works
    limiter.reset();
    const afterReset = limiter.tryAcquire();
    assert.strictEqual(afterReset.allowed, true, 'After reset, requests must be allowed again');
    console.log('  ✓ RateLimiter reset clears sliding window');

    // -------------------------------------------------------------------------
    // TEST 3: Circuit Breaker State Machine
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Circuit Breaker State Machine ---');
    const breaker = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 150 });
    
    assert.strictEqual(breaker.state, CircuitState.CLOSED);
    assert.strictEqual(breaker.canExecute(), true);
    console.log('  ✓ Initial state is CLOSED and allows execution');

    // 1st failure
    breaker.recordFailure(new Error('Failure 1'));
    assert.strictEqual(breaker.state, CircuitState.CLOSED);
    assert.strictEqual(breaker.failures, 1);

    // 2nd failure
    breaker.recordFailure(new Error('Failure 2'));
    assert.strictEqual(breaker.state, CircuitState.CLOSED);
    assert.strictEqual(breaker.failures, 2);

    // 3rd failure -> Trips to OPEN
    breaker.recordFailure(new Error('Failure 3'));
    assert.strictEqual(breaker.state, CircuitState.OPEN);
    assert.strictEqual(breaker.canExecute(), false);
    assert.strictEqual(breaker.tripsCount, 1);
    console.log('  ✓ 3 consecutive failures successfully trip circuit to OPEN');

    // Wait for cooldown to expire
    await new Promise(r => setTimeout(r, 160));
    assert.strictEqual(breaker.canExecute(), true, 'After cooldown, canExecute must allow trial probe');
    assert.strictEqual(breaker.state, CircuitState.HALF_OPEN, 'State auto-transitions to HALF_OPEN');
    console.log('  ✓ Cooldown expiration transitions state to HALF_OPEN');

    // Trial probe succeeds -> Returns to CLOSED
    breaker.recordSuccess();
    assert.strictEqual(breaker.state, CircuitState.CLOSED);
    assert.strictEqual(breaker.failures, 0);
    console.log('  ✓ Successful probe in HALF_OPEN restores circuit to CLOSED');

    // Force Open & Force Closed
    breaker.forceOpen('Test Force Open');
    assert.strictEqual(breaker.state, CircuitState.OPEN);
    breaker.forceClosed();
    assert.strictEqual(breaker.state, CircuitState.CLOSED);
    console.log('  ✓ Manual forceOpen and forceClosed operate reliably');

    // -------------------------------------------------------------------------
    // TEST 4: PII Redaction & Grounding Safety
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: PII Redaction & Grounding Safety ---');
    const gateway = new GeminiAIGateway();
    const sensitivePrompt = 'My phone is 9876543210 and email is student.rahul@gmail.com and Aadhaar 1234 5678 9012';
    const sanitized = gateway.sanitizePII(sensitivePrompt);
    
    assert.ok(!sanitized.includes('9876543210'), 'Phone number must be scrubbed');
    assert.ok(!sanitized.includes('student.rahul@gmail.com'), 'Email address must be scrubbed');
    assert.ok(!sanitized.includes('1234 5678 9012'), 'Aadhaar ID must be scrubbed');
    assert.ok(sanitized.includes('[REDACTED_PHONE]'), 'Phone replaced with REDACTED placeholder');
    assert.ok(sanitized.includes('[REDACTED_EMAIL]'), 'Email replaced with REDACTED placeholder');
    console.log('  ✓ Candidate PII scrubbed cleanly before transmission');

    const groundingPrompt = gateway.buildSystemInstruction({
      collegeName: 'DRIEMS Polytechnic (Autonomous)',
      branches: ['Mechanical Engineering', 'Civil Engineering'],
      feeSummary: 'Tuition: ₹35,000/yr (Demo)'
    }, 'hi');
    assert.ok(groundingPrompt.includes('DRIEMS Polytechnic (Autonomous)'));
    assert.ok(groundingPrompt.includes('Mechanical Engineering'));
    assert.ok(groundingPrompt.includes('Minimum 35% aggregate'));
    console.log('  ✓ Grounding system instruction strictly bounds institutional facts and eligibility');

    // -------------------------------------------------------------------------
    // TEST 5: Automatic Fallback Matrix
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Automatic Fallback Matrix ---');
    const manager = new AIGatewayManager();

    // 5.1 Mode: Missing API Key Fallback
    console.log('  Testing Fallback 5.1: Missing API Key...');
    const resNoKey = await manager.processCounsellingMessage({
      sessionId: 'test_phase6_no_key',
      message: 'What diploma branches are available at DRIEMS?',
      collegeCode: 'DRIEMS',
      options: { forceAI: true, apiKey: null }
    });
    assert.strictEqual(resNoKey.engineUsed, 'DETERMINISTIC_FALLBACK');
    assert.strictEqual(resNoKey.fallbackReason, 'MISSING_API_KEY');
    assert.ok(resNoKey.reply.includes('Engineering') || resNoKey.reply.includes('Branches') || resNoKey.reply.includes('Diploma'));
    assert.ok(resNoKey.reply.includes('DEMO DATA'));
    console.log('  ✓ Missing API key cleanly falls back to deterministic engine');

    // 5.2 Mode: Request Timeout Fallback
    console.log('  Testing Fallback 5.2: Request Timeout...');
    const timeoutGateway = new GeminiAIGateway({ apiKey: 'mock_key', timeoutMs: 1, baseUrl: 'http://10.255.255.1' });
    const timeoutManager = new AIGatewayManager({ gateway: timeoutGateway });
    const resTimeout = await timeoutManager.processCounsellingMessage({
      sessionId: 'test_phase6_timeout',
      message: 'Fee details please',
      options: { forceAI: true }
    });
    assert.strictEqual(resTimeout.engineUsed, 'DETERMINISTIC_FALLBACK');
    assert.ok(resTimeout.fallbackReason === 'TIMEOUT' || resTimeout.fallbackReason === 'NETWORK_ERROR');
    console.log(`  ✓ Gateway timeout handled cleanly: fallbackReason=${resTimeout.fallbackReason}`);

    // 5.3 Mode: Rate Limit Exceeded Fallback
    console.log('  Testing Fallback 5.3: Rate Limit Exceeded (15 RPM)...');
    const rateLimitedGateway = new GeminiAIGateway({ apiKey: 'mock_key' });
    // Exhaust rate limiter
    for (let i = 0; i < 15; i++) {
      rateLimitedGateway.rateLimiter.tryAcquire();
    }
    const rateLimitManager = new AIGatewayManager({ gateway: rateLimitedGateway });
    const resRateLimit = await rateLimitManager.processCounsellingMessage({
      sessionId: 'test_phase6_rate_limit',
      message: 'Tell me about hostel facilities',
      options: { forceAI: true }
    });
    assert.strictEqual(resRateLimit.engineUsed, 'DETERMINISTIC_FALLBACK');
    assert.strictEqual(resRateLimit.fallbackReason, 'RATE_LIMIT_EXCEEDED');
    console.log('  ✓ Rate limit quota exceeded triggers immediate deterministic fallback');

    // 5.4 Mode: Circuit Breaker Open Fallback
    console.log('  Testing Fallback 5.4: Circuit Breaker Open...');
    const circuitGateway = new GeminiAIGateway({ apiKey: 'mock_key' });
    circuitGateway.circuitBreaker.forceOpen('Unit test trip');
    const circuitManager = new AIGatewayManager({ gateway: circuitGateway });
    const resCircuit = await circuitManager.processCounsellingMessage({
      sessionId: 'test_phase6_circuit_open',
      message: 'Am I eligible with 65% in 10th?',
      options: { forceAI: true }
    });
    assert.strictEqual(resCircuit.engineUsed, 'DETERMINISTIC_FALLBACK');
    assert.strictEqual(resCircuit.fallbackReason, 'CIRCUIT_BREAKER_OPEN');
    console.log('  ✓ Circuit breaker OPEN status bypasses network call directly to deterministic engine');

    // 5.5 Mode: Simulated Successful AI Response
    console.log('  Testing Mock 5.5: Successful AI Response Path...');
    class MockSuccessGateway extends IAIGateway {
      constructor() {
        super({ name: 'MockSuccessGateway', enabled: true });
      }
      async generateResponse({ prompt, language }) {
        return {
          text: `Grounded guidance for ${prompt} in language ${language}. DRIEMS Polytechnic offers high quality technical education.`,
          model: 'gemini-1.5-flash-mock',
          usage: { promptTokens: 40, candidatesTokens: 35 },
          language,
          engineUsed: 'AI_GEMINI'
        };
      }
      isHealthy() { return true; }
      getStatus() { return { healthy: true }; }
      reset() {}
    }
    const successManager = new AIGatewayManager({ gateway: new MockSuccessGateway() });
    const resSuccess = await successManager.processCounsellingMessage({
      sessionId: 'test_phase6_success_sim',
      message: 'Tell me about CSE at DRIEMS',
      options: { forceAI: true }
    });
    assert.strictEqual(resSuccess.engineUsed, 'AI_GEMINI');
    assert.ok(resSuccess.reply.includes('DEMO DATA'));
    assert.strictEqual(resSuccess.model, 'gemini-1.5-flash-mock');
    console.log('  ✓ Successful AI response returned with engineUsed=AI_GEMINI and demo disclaimer');

    // -------------------------------------------------------------------------
    // TEST 6: Multilingual Preservation Invariant
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: Multilingual Preservation Invariant ---');
    const fallbackManager = new AIGatewayManager(); // default no key -> fallback

    // 6.1 Odia script input
    const odiaRes = await fallbackManager.processCounsellingMessage({
      sessionId: 'test_phase6_odia',
      message: 'ମୁଁ ୧୦ମ ପାସ କରିଛି, ଡ୍ରିମ୍ସରେ କେଉଁ ଶାଖା ଭଲ?',
      collegeCode: 'DRIEMS',
      options: { forceAI: true }
    });
    assert.strictEqual(odiaRes.language, 'or', 'Language must resolve to Odia');
    assert.ok(/[\u0B00-\u0B7F]/.test(odiaRes.reply), 'Response must contain Odia characters');
    console.log('  ✓ Odia input receives authentic Odia response under fallback');

    // 6.2 Hindi script input
    const hindiRes = await fallbackManager.processCounsellingMessage({
      sessionId: 'test_phase6_hindi',
      message: 'मुझे 10वीं के बाद मैकेनिकल इंजीनियरिंग में डिप्लोमा करना है।',
      collegeCode: 'DRIEMS',
      options: { forceAI: true }
    });
    assert.strictEqual(hindiRes.language, 'hi', 'Language must resolve to Hindi');
    assert.ok(/[\u0900-\u097F]/.test(hindiRes.reply), 'Response must contain Devanagari characters');
    console.log('  ✓ Hindi input receives authentic Hindi response under fallback');

    // 6.3 English input
    const englishRes = await fallbackManager.processCounsellingMessage({
      sessionId: 'test_phase6_english',
      message: 'Hello, what are the hostel fees at DRIEMS?',
      collegeCode: 'DRIEMS',
      options: { forceAI: true }
    });
    assert.strictEqual(englishRes.language, 'en', 'Language must resolve to English');
    assert.ok(englishRes.reply.includes('hostel') || englishRes.reply.includes('Hostel'));
    console.log('  ✓ English input receives clear English response under fallback');

    // -------------------------------------------------------------------------
    // TEST 7: HTTP Integration Endpoints
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 7: HTTP Integration Endpoints ---');

    // 7.1 GET /api/v1/chat/ai-status
    const statusRes = await request('GET', '/api/v1/chat/ai-status');
    assert.strictEqual(statusRes.status, 200, 'GET /api/v1/chat/ai-status must return HTTP 200');
    assert.strictEqual(statusRes.data.success, true);
    assert.ok(statusRes.data.data.gateway !== undefined, 'Gateway telemetry must be present');
    assert.strictEqual(statusRes.data.data.gateway.circuitBreaker.state, 'CLOSED');
    console.log('  ✓ GET /api/v1/chat/ai-status operational with circuit breaker and rate limit status');

    // 7.2 POST /api/v1/chat/message via live server
    const chatMsgRes = await request('POST', '/api/v1/chat/message', {
      sessionId: 'http_test_phase6_session',
      message: 'What is the eligibility for Civil Engineering?',
      collegeCode: 'DRIEMS'
    });
    assert.strictEqual(chatMsgRes.status, 200, 'POST /api/v1/chat/message must return HTTP 200');
    assert.strictEqual(chatMsgRes.data.success, true);
    assert.ok(chatMsgRes.data.data.reply.length > 0);
    assert.ok(chatMsgRes.data.data.engineUsed !== undefined, 'engineUsed must be populated');
    console.log(`  ✓ POST /api/v1/chat/message responded with engineUsed=${chatMsgRes.data.data.engineUsed}`);

    // 7.3 GET /api/v1/chat/history/:sessionId
    const historyRes = await request('GET', `/api/v1/chat/history/http_test_phase6_session`);
    assert.strictEqual(historyRes.status, 200);
    assert.strictEqual(historyRes.data.success, true);
    assert.ok(historyRes.data.data.messages.length >= 2, 'History must contain user and bot messages');
    console.log('  ✓ GET /api/v1/chat/history reflects recorded conversation session');

    // -------------------------------------------------------------------------
    // TEST 8: Data Integrity & Invariants (All 65 DRIEMS Student Records)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 8: Data Integrity & Invariants ---');
    const driemsCollege = await College.findOne({ code: 'DRIEMS' });
    assert.ok(driemsCollege, 'DRIEMS College record must exist');

    const driemsStudentCount = await Student.countDocuments({ collegeId: driemsCollege._id });
    assert.strictEqual(driemsStudentCount, 65, 'CRITICAL INVARIANT: Exactly 65 DRIEMS student records must exist');
    console.log(`  ✓ CRITICAL INVARIANT VERIFIED: Exactly ${driemsStudentCount} student records intact for DRIEMS`);

    console.log('\n======================================================================');
    console.log('  ALL PHASE 6 AI GATEWAY & FAULT-TOLERANCE TESTS PASSED (8/8)');
    console.log('======================================================================\n');

  } finally {
    server.close();
    await mongoose.disconnect();
    await new Promise((r) => setTimeout(r, 150));
  }
}

runPhase6Tests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Phase 6 Test Failed:', err);
    process.exit(1);
  });
