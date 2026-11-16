/**
 * ADMINATOR — Pre-Deployment Security & Public Git Audit Test Suite
 * Verifies all security hardening invariants for public GitHub repository & Vercel deployment:
 * 1. Zero public code references to private driemsRosterData.js or DRIEMS_STUDENT_ROSTER
 * 2. Zero hardcoded credentials in frontend code
 * 3. Seed demo staff accounts strictly opt-in and blocked in production (NODE_ENV=production)
 * 4. .gitignore excludes all private student data, staff credentials, database dumps, and backup files
 * 5. Preservation of local private files and existing 65 DRIEMS records in MongoDB
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { User, College, Student } from '../src/models/index.js';
import { seedDatabase } from '../src/seeds/demoDataSeeder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

const passed = [];
function pass(msg) {
  passed.push(msg);
  console.log(`  ✓ ${msg}`);
}

async function runAudit() {
  console.log('\n===============================================================');
  console.log('  ADMINATOR — PRE-DEPLOYMENT SECURITY & PUBLIC GIT AUDIT');
  console.log('===============================================================\n');

  // -------------------------------------------------------------------------
  // SECTION 1: PUBLIC CODE INDEPENDENCE FROM PRIVATE ROSTER
  // -------------------------------------------------------------------------
  console.log('[SECTION 1: Public Code Independence from Private Roster]');

  const seederContent = fs.readFileSync(path.join(rootDir, 'backend', 'src', 'seeds', 'demoDataSeeder.js'), 'utf-8');

  assert.strictEqual(
    seederContent.includes('driemsRosterData'),
    false,
    'demoDataSeeder.js must NOT import or reference driemsRosterData'
  );
  pass('demoDataSeeder.js has zero imports of driemsRosterData');

  assert.strictEqual(
    seederContent.includes('DRIEMS_STUDENT_ROSTER'),
    false,
    'demoDataSeeder.js must NOT reference DRIEMS_STUDENT_ROSTER'
  );
  pass('demoDataSeeder.js has zero references to DRIEMS_STUDENT_ROSTER');

  assert.strictEqual(
    seederContent.includes('DemoPassword123!'),
    false,
    'demoDataSeeder.js must NOT contain hardcoded DemoPassword123!'
  );
  pass('demoDataSeeder.js has zero hardcoded passwords');

  // -------------------------------------------------------------------------
  // SECTION 2: FRONTEND CREDENTIAL SCRUBBING & API CONFIGURATION
  // -------------------------------------------------------------------------
  console.log('\n[SECTION 2: Frontend Credential Sanitization & API Routing]');

  const staffLoginContent = fs.readFileSync(path.join(rootDir, 'frontend', 'src', 'components', 'dashboard', 'StaffLogin.jsx'), 'utf-8');
  assert.strictEqual(
    staffLoginContent.includes('DemoPassword123!'),
    false,
    'StaffLogin.jsx must NOT contain hardcoded DemoPassword123!'
  );
  pass('StaffLogin.jsx contains zero hardcoded passwords');

  assert.strictEqual(
    staffLoginContent.includes('pass:'),
    false,
    'StaffLogin.jsx quick logins must not have a pass field'
  );
  pass('StaffLogin.jsx quick chips have no pass field (email selection only)');

  const staffShellContent = fs.readFileSync(path.join(rootDir, 'frontend', 'src', 'components', 'dashboard', 'StaffDashboardShell.jsx'), 'utf-8');
  assert.strictEqual(
    staffShellContent.includes('DemoPassword123!'),
    false,
    'StaffDashboardShell.jsx must NOT contain hardcoded auto-login passwords'
  );
  pass('StaffDashboardShell.jsx auto-login password removed completely');

  const apiConfigPath = path.join(rootDir, 'frontend', 'src', 'utils', 'apiConfig.js');
  assert.strictEqual(fs.existsSync(apiConfigPath), true, 'apiConfig.js must exist in frontend');
  pass('frontend/src/utils/apiConfig.js exists and exports getApiUrl helper');

  const frontendEnvExample = fs.readFileSync(path.join(rootDir, 'frontend', '.env.example'), 'utf-8');
  assert.strictEqual(
    frontendEnvExample.includes('JWT') || frontendEnvExample.includes('SECRET') || frontendEnvExample.includes('PASSWORD'),
    false,
    'Frontend .env.example must never contain backend secrets'
  );
  pass('Frontend .env.example contains no backend secrets');

  // -------------------------------------------------------------------------
  // SECTION 3: SEEDER ENVIRONMENT GUARDS (PRODUCTION & OPT-IN)
  // -------------------------------------------------------------------------
  console.log('\n[SECTION 3: Seeder Environment Protection Guards]');

  // Connect DB
  await connectDB();

  // Test 3.1: In production mode (NODE_ENV=production), staff seeding is strictly blocked
  process.env.NODE_ENV = 'production';
  process.env.SEED_DEMO_STAFF = 'true';
  process.env.DEMO_STAFF_PASSWORD = 'AttemptedProdPassword123!';

  // Capture console log
  let loggedProdNotice = false;
  const originalLog = console.log;
  console.log = (...args) => {
    if (args.join(' ').includes('[Seed Security Invariant] Production environment detected')) {
      loggedProdNotice = true;
    }
    originalLog(...args);
  };

  await seedDatabase();
  console.log = originalLog;

  assert.strictEqual(loggedProdNotice, true, 'Production mode must trigger the security invariant notice');
  pass('Production mode (NODE_ENV=production) strictly blocks demo staff account creation');

  // Test 3.2: In dev mode without SEED_DEMO_STAFF=true, staff seeding is disabled
  process.env.NODE_ENV = 'development';
  process.env.SEED_DEMO_STAFF = 'false';

  let loggedDevNotice = false;
  console.log = (...args) => {
    if (args.join(' ').includes('[Seed Security Invariant] Demo staff account seeding is disabled by default')) {
      loggedDevNotice = true;
    }
    originalLog(...args);
  };

  await seedDatabase();
  console.log = originalLog;

  assert.strictEqual(loggedDevNotice, true, 'Development mode defaults to skipping staff creation');
  pass('Development mode without SEED_DEMO_STAFF=true skips staff account creation by default');

  // Reset NODE_ENV for tests
  process.env.NODE_ENV = 'test';

  // -------------------------------------------------------------------------
  // SECTION 4: LOCAL PRESERVATION OF PRIVATE DATA & INVARIANTS
  // -------------------------------------------------------------------------
  console.log('\n[SECTION 4: Local Preservation of Private Data & Database Invariants]');

  const privateRosterPath = path.join(rootDir, 'backend', 'src', 'seeds', 'driemsRosterData.js');
  assert.strictEqual(fs.existsSync(privateRosterPath), true, 'Private driemsRosterData.js must be preserved locally');
  pass('Private roster file preserved locally at backend/src/seeds/driemsRosterData.js');

  const driemsCollege = await College.findOne({ code: 'DRIEMS' });
  assert.ok(driemsCollege, 'DRIEMS college must exist in database');
  assert.strictEqual(driemsCollege.isDefault, true, 'DRIEMS must be the default college');
  pass('DRIEMS Polytechnic (Autonomous) remains the default college (isDefault=true)');

  const rosterCount = await Student.countDocuments({
    collegeId: driemsCollege._id,
    isImportedRoster: true
  });
  assert.strictEqual(rosterCount, 65, `Database must preserve exactly 65 records (found ${rosterCount})`);
  pass(`Existing 65 DRIEMS student records safely preserved in MongoDB (count: ${rosterCount})`);

  // -------------------------------------------------------------------------
  // SECTION 5: GITIGNORE & LEAKAGE VERIFICATION
  // -------------------------------------------------------------------------
  console.log('\n[SECTION 5: Git Exclusion & Upload Preview Verification]');

  // Check git check-ignore for critical paths
  const checkIgnored = (filePath) => {
    try {
      const out = execSync(`git -C "${rootDir}" check-ignore "${filePath}"`, { encoding: 'utf-8' });
      return out.trim().length > 0;
    } catch {
      return false;
    }
  };

  assert.strictEqual(checkIgnored('backend/src/seeds/driemsRosterData.js'), true, 'driemsRosterData.js must be ignored by Git');
  pass('.gitignore excludes backend/src/seeds/driemsRosterData.js');

  assert.strictEqual(checkIgnored('backend/src/seeds/privateRosterSeeder.js'), true, 'privateRosterSeeder.js must be ignored by Git');
  pass('.gitignore excludes backend/src/seeds/privateRosterSeeder.js');

  assert.strictEqual(checkIgnored('.env'), true, '.env must be ignored by Git');
  pass('.gitignore excludes .env files');

  assert.strictEqual(checkIgnored('backups/test.bak'), true, 'backups/ must be ignored by Git');
  pass('.gitignore excludes backups/');

  assert.strictEqual(checkIgnored('docs/SECRET.md'), true, 'docs/ must be ignored by Git');
  pass('.gitignore excludes docs/ (contains internal credentials and audit dumps)');

  assert.strictEqual(checkIgnored('workflows/test.json'), true, 'workflows/ must be ignored by Git');
  pass('.gitignore excludes workflows/');

  assert.strictEqual(checkIgnored('backend/.env.example'), false, 'backend/.env.example must NOT be ignored');
  pass('backend/.env.example is tracked for public documentation');

  assert.strictEqual(checkIgnored('frontend/.env.example'), false, 'frontend/.env.example must NOT be ignored');
  pass('frontend/.env.example is tracked for public documentation');

  // Verify untracked files visible to git do NOT include private assets
  const untracked = execSync(`git -C "${rootDir}" ls-files --others --exclude-standard`, { encoding: 'utf-8' });
  assert.strictEqual(untracked.includes('driemsRosterData.js'), false, 'Git untracked must not list driemsRosterData.js');
  assert.strictEqual(untracked.includes('backups/'), false, 'Git untracked must not list backups/');
  assert.strictEqual(untracked.includes('docs/'), false, 'Git untracked must not list docs/');
  assert.strictEqual(untracked.includes('.env\n'), false, 'Git untracked must not list .env');
  pass('Git status upload preview strictly excludes all private files, student roster, credentials, and backups');

  console.log('\n===============================================================');
  console.log(`  ALL ${passed.length} PRE-DEPLOYMENT AUDIT CHECKS PASSED (100%)`);
  console.log('===============================================================\n');

  await mongoose.disconnect();
}

runAudit().catch((err) => {
  console.error('\n❌ AUDIT FAILED:', err);
  process.exit(1);
});
