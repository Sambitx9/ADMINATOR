import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../src/app.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/adminator_demo';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_SCREENSHOT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\0dbbe9c6-c86c-4bd6-9851-0b4d8344efbb\\screenshots';
const DOCS_EVIDENCE_DIR = path.resolve('..', 'docs', 'phase5-evidence');

console.log('======================================================================');
console.log('  ADMINATOR — PHASE 5 SCREENSHOT CAPTURE UTILITY');
console.log('======================================================================');

if (!fs.existsSync(ARTIFACT_SCREENSHOT_DIR)) {
  fs.mkdirSync(ARTIFACT_SCREENSHOT_DIR, { recursive: true });
}
if (!fs.existsSync(DOCS_EVIDENCE_DIR)) {
  fs.mkdirSync(DOCS_EVIDENCE_DIR, { recursive: true });
}

async function capture() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB:', MONGODB_URI);

  // Start HTTP Server on port 5056
  const server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(5056, '127.0.0.1', () => {
      console.log('✅ Server listening on http://127.0.0.1:5056');
      resolve();
    });
  });

  const targets = [
    {
      name: 'phase5_01_comparison_desktop_1440px_en.png',
      width: 1440,
      height: 900,
      url: 'http://127.0.0.1:5056/?view=compare&lang=en'
    },
    {
      name: 'phase5_02_comparison_desktop_1440px_or.png',
      width: 1440,
      height: 900,
      url: 'http://127.0.0.1:5056/?view=compare&lang=or'
    },
    {
      name: 'phase5_03_comparison_desktop_1440px_hi.png',
      width: 1440,
      height: 900,
      url: 'http://127.0.0.1:5056/?view=compare&lang=hi'
    },
    {
      name: 'phase5_04_comparison_tablet_820px_en.png',
      width: 820,
      height: 1180,
      url: 'http://127.0.0.1:5056/?view=compare&lang=en'
    },
    {
      name: 'phase5_05_comparison_mobile_375px_en.png',
      width: 375,
      height: 812,
      url: 'http://127.0.0.1:5056/?view=compare&lang=en'
    },
    {
      name: 'phase5_06_analytics_desktop_1440px_admin.png',
      width: 1440,
      height: 900,
      url: 'http://127.0.0.1:5056/?view=staff&tab=analytics&autoUser=admin&lang=en'
    },
    {
      name: 'phase5_07_analytics_desktop_1440px_or.png',
      width: 1440,
      height: 900,
      url: 'http://127.0.0.1:5056/?view=staff&tab=analytics&autoUser=admin&lang=or'
    },
    {
      name: 'phase5_08_analytics_desktop_1440px_hi.png',
      width: 1440,
      height: 900,
      url: 'http://127.0.0.1:5056/?view=staff&tab=analytics&autoUser=admin&lang=hi'
    },
    {
      name: 'phase5_09_analytics_tablet_820px_admin.png',
      width: 820,
      height: 1180,
      url: 'http://127.0.0.1:5056/?view=staff&tab=analytics&autoUser=admin&lang=en'
    },
    {
      name: 'phase5_10_analytics_mobile_375px_admin.png',
      width: 375,
      height: 812,
      url: 'http://127.0.0.1:5056/?view=staff&tab=analytics&autoUser=admin&lang=en'
    }
  ];

  for (const t of targets) {
    const artifactPath = path.join(ARTIFACT_SCREENSHOT_DIR, t.name);
    const docsPath = path.join(DOCE_OR_DOCS(DOCS_EVIDENCE_DIR), t.name);

    console.log(`📸 Capturing: ${t.name} (${t.width}x${t.height})...`);
    const cmd = `"${CHROME_PATH}" --headless=new --no-sandbox --disable-gpu --hide-scrollbars --virtual-time-budget=5000 --window-size=${t.width},${t.height} --screenshot="${artifactPath}" "${t.url}"`;

    try {
      execSync(cmd, { stdio: 'pipe', timeout: 20000 });
      // Copy to docs/phase5-evidence
      if (fs.existsSync(artifactPath)) {
        fs.copyFileSync(artifactPath, docsPath);
        console.log(`  ✓ Successfully saved ${t.name}`);
      } else {
        console.error(`  ✗ Output file not found for ${t.name}`);
      }
    } catch (err) {
      console.error(`  ✗ Error capturing ${t.name}:`, err.message);
    }
  }

  server.close();
  await mongoose.disconnect();
  console.log('\n🎉 ALL 10 PHASE 5 SCREENSHOTS CAPTURED CLEANLY!');
}

function DOCE_OR_DOCS(dir) {
  return dir;
}

capture().catch((err) => {
  console.error('Fatal error during screenshot capture:', err);
  process.exit(1);
});