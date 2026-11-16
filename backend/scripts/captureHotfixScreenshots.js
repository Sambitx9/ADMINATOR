import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../src/app.js';
import { handleIncomingMessage } from '../src/engine/deterministicCounsellingEngine.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/adminator_demo';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\0dbbe9c6-c86c-4bd6-9851-0b4d8344efbb\\screenshots';
const DOCS_EVIDENCE_DIR = path.resolve('docs/audit-evidence');

if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
if (!fs.existsSync(DOCS_EVIDENCE_DIR)) fs.mkdirSync(DOCS_EVIDENCE_DIR, { recursive: true });

async function runScreenshotCapture() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Pre-populate interactive Odia and Hindi sessions
  const odiaSid = 'hotfix-sim-odia';
  await handleIncomingMessage({ sessionId: odiaSid, message: 'ନମସ୍କାର', selectedLanguage: 'or' });
  await handleIncomingMessage({ sessionId: odiaSid, message: 'କମ୍ପ୍ୟୁଟର ସାଇନ୍ସ ଇଞ୍ଜିନିୟରିଂ ବିଷୟରେ କୁହନ୍ତୁ', selectedLanguage: 'or' });

  const hindiSid = 'hotfix-sim-hindi';
  await handleIncomingMessage({ sessionId: hindiSid, message: 'नमस्ते', selectedLanguage: 'hi' });
  await handleIncomingMessage({ sessionId: hindiSid, message: 'मैकेनिकल इंजीनियरिंग में क्या पढ़ाया जाता है?', selectedLanguage: 'hi' });

  // Start internal test server on port 5088
  const server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(5088, '127.0.0.1', () => {
      console.log('✅ Temporary capture server listening on http://127.0.0.1:5088');
      resolve();
    });
  });

  const captures = [
    { name: 'hotfix_01_student_portal_en.png', width: 1440, height: 900, url: 'http://127.0.0.1:5088/?view=student&lang=en' },
    { name: 'hotfix_02_student_portal_or.png', width: 1440, height: 900, url: 'http://127.0.0.1:5088/?view=student&lang=or' },
    { name: 'hotfix_03_student_portal_hi.png', width: 1440, height: 900, url: 'http://127.0.0.1:5088/?view=student&lang=hi' },
    { name: 'hotfix_04_simulator_en.png', width: 1440, height: 900, url: 'http://127.0.0.1:5088/?view=simulator&lang=en' },
    { name: 'hotfix_05_simulator_or.png', width: 1440, height: 900, url: `http://127.0.0.1:5088/?view=simulator&lang=or&sid=${odiaSid}` },
    { name: 'hotfix_06_simulator_hi.png', width: 1440, height: 900, url: `http://127.0.0.1:5088/?view=simulator&lang=hi&sid=${hindiSid}` },
    { name: 'hotfix_07_eligibility_modal_or.png', width: 1440, height: 900, url: 'http://127.0.0.1:5088/?view=simulator&lang=or&modal=eligibility' },
    { name: 'hotfix_08_eligibility_modal_hi.png', width: 1440, height: 900, url: 'http://127.0.0.1:5088/?view=simulator&lang=hi&modal=eligibility' },
    { name: 'hotfix_09_tracking_modal_or.png', width: 1440, height: 900, url: 'http://127.0.0.1:5088/?view=simulator&lang=or&modal=tracking' },
    { name: 'hotfix_10_tracking_modal_hi.png', width: 1440, height: 900, url: 'http://127.0.0.1:5088/?view=simulator&lang=hi&modal=tracking' },
    { name: 'hotfix_11_staff_crm_pipeline_or.png', width: 1440, height: 900, url: 'http://127.0.0.1:5088/?view=staff&lang=or&autoUser=counsellor' },
    { name: 'hotfix_12_staff_crm_pipeline_hi.png', width: 1440, height: 900, url: 'http://127.0.0.1:5088/?view=staff&lang=hi&autoUser=counsellor' }
  ];

  console.log(`Starting headless Chrome capture of ${captures.length} screenshots...`);

  for (const cap of captures) {
    const artTarget = path.join(ARTIFACT_DIR, cap.name);
    const docsTarget = path.join(DOCS_EVIDENCE_DIR, cap.name);

    const cmd = `"${CHROME_PATH}" --headless=new --hide-scrollbars --virtual-time-budget=4000 --window-size=${cap.width},${cap.height} --screenshot="${artTarget}" "${cap.url}"`;
    try {
      execSync(cmd, { stdio: 'ignore', timeout: 20000 });
      fs.copyFileSync(artTarget, docsTarget);
      console.log(`  📸 Captured: ${cap.name} (${cap.width}x${cap.height})`);
    } catch (err) {
      console.error(`  ❌ Failed to capture ${cap.name}:`, err.message);
    }
  }

  console.log('✅ Screenshot capture completed.');
  server.close();
  await mongoose.disconnect();
}

runScreenshotCapture().catch(e => {
  console.error('Screenshot run failed:', e);
  process.exit(1);
});
