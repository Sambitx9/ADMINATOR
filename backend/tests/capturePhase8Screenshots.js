/**
 * ADMINATOR — Phase 8 Responsive Visual Acceptance Screenshot Capture (Native CDP)
 * 
 * Audits all 11 requested breakpoints:
 *   320px, 360px, 375px, 390px, 430px, 768px, 820px, 1024px, 1280px, 1440px, 1920px
 */

import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../src/app.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/adminator_demo';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_SCREENSHOT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\0dbbe9c6-c86c-4bd6-9851-0b4d8344efbb\\screenshots';
const DOCS_EVIDENCE_DIR = path.resolve('docs', 'phase8-evidence');

console.log('======================================================================');
console.log('  ADMINATOR — PHASE 8 RESPONSIVE SCREENSHOT AUDIT (11 BREAKPOINTS)');
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

  // Start HTTP Server on port 5058
  const server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(5058, '127.0.0.1', () => {
      console.log('✅ Server listening on http://127.0.0.1:5058');
      resolve();
    });
  });

  // Spawn headless chrome with CDP on port 9225
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    'about:blank'
  ]);

  // Wait for Chrome CDP to initialize
  let debuggerUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 400));
    try {
      const res = await fetch('http://127.0.0.1:9225/json/list');
      const list = await res.json();
      if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
        debuggerUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!debuggerUrl) {
    chromeProcess.kill();
    server.close();
    await mongoose.disconnect();
    throw new Error('Could not connect to Chrome DevTools CDP on port 9225');
  }

  console.log('✅ Connected to Chrome CDP via WebSocket:', debuggerUrl);

  const ws = new WebSocket(debuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  const sendCommand = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      const handler = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data.id === id) {
            ws.removeEventListener('message', handler);
            if (data.error) reject(new Error(data.error.message));
            else resolve(data.result);
          }
        } catch (e) {
          reject(e);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await sendCommand('Page.enable');
  await sendCommand('DOM.enable');

  const targets = [
    // 1. Mobile Breakpoints
    {
      name: 'phase8_01_landing_mobile_320px.png',
      width: 320,
      height: 700,
      url: 'http://127.0.0.1:5058/?lang=en'
    },
    {
      name: 'phase8_02_landing_mobile_360px_hi.png',
      width: 360,
      height: 740,
      url: 'http://127.0.0.1:5058/?lang=hi'
    },
    {
      name: 'phase8_03_chat_mobile_375px_or.png',
      width: 375,
      height: 812,
      url: 'http://127.0.0.1:5058/?lang=or'
    },
    {
      name: 'phase8_04_comparison_mobile_390px.png',
      width: 390,
      height: 844,
      url: 'http://127.0.0.1:5058/?view=compare&lang=en'
    },
    {
      name: 'phase8_05_landing_mobile_430px.png',
      width: 430,
      height: 932,
      url: 'http://127.0.0.1:5058/?lang=en'
    },
    // 2. Tablet Breakpoints
    {
      name: 'phase8_06_analytics_tablet_768px.png',
      width: 768,
      height: 1024,
      url: 'http://127.0.0.1:5058/?view=staff&tab=analytics&autoUser=admin&lang=en'
    },
    {
      name: 'phase8_07_comparison_tablet_820px_or.png',
      width: 820,
      height: 1180,
      url: 'http://127.0.0.1:5058/?view=compare&lang=or'
    },
    // 3. Small Desktop & Laptop Breakpoints
    {
      name: 'phase8_08_crm_leads_desktop_1024px.png',
      width: 1024,
      height: 768,
      url: 'http://127.0.0.1:5058/?view=staff&tab=leads&autoUser=admin&lang=en'
    },
    {
      name: 'phase8_09_landing_desktop_1280px_hi.png',
      width: 1280,
      height: 800,
      url: 'http://127.0.0.1:5058/?lang=hi'
    },
    // 4. Full HD Desktop Breakpoints
    {
      name: 'phase8_10_analytics_desktop_1440px_or.png',
      width: 1440,
      height: 900,
      url: 'http://127.0.0.1:5058/?view=staff&tab=analytics&autoUser=admin&lang=or'
    },
    {
      name: 'phase8_11_comparison_matrix_1920px.png',
      width: 1920,
      height: 1080,
      url: 'http://127.0.0.1:5058/?view=compare&lang=en'
    }
  ];

  for (const t of targets) {
    const artifactPath = path.join(ARTIFACT_SCREENSHOT_DIR, t.name);
    const docsPath = path.join(DOCS_EVIDENCE_DIR, t.name);

    console.log(`📸 Capturing: ${t.name} (${t.width}x${t.height})...`);

    // Override viewport metrics
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: t.width,
      height: t.height,
      deviceScaleFactor: 1,
      mobile: t.width < 768
    });

    // Navigate
    await sendCommand('Page.navigate', { url: t.url });

    // Wait 1.5s for page rendering and animations
    await new Promise((r) => setTimeout(r, 1500));

    // Capture screenshot
    const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');

    fs.writeFileSync(artifactPath, buffer);
    fs.writeFileSync(docsPath, buffer);
    console.log(`  ✓ Saved: ${t.name}`);
  }

  ws.close();
  chromeProcess.kill();
  server.close();
  await mongoose.disconnect();

  console.log('\n🎉 ALL 11 RESPONSIVE AUDIT SCREENSHOTS CAPTURED WITH 100% SUCCESS!');
}

capture().catch((err) => {
  console.error('Fatal error during screenshot capture:', err);
  process.exit(1);
});
