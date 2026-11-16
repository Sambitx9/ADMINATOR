import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\0dbbe9c6-c86c-4bd6-9851-0b4d8344efbb\\screenshots';
const DOCS_EVIDENCE_DIR = path.resolve('docs', 'phase5-evidence');

if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
if (!fs.existsSync(DOCS_EVIDENCE_DIR)) fs.mkdirSync(DOCS_EVIDENCE_DIR, { recursive: true });

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.pending.has(data.id)) {
          const { resolve, reject } = this.pending.get(data.id);
          this.pending.delete(data.id);
          if (data.error) reject(new Error(data.error.message));
          else resolve(data.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function capturePhase5() {
  console.log('===============================================================');
  console.log('  ADMINATOR — PHASE 5 CDP HIGH-RES SCREENSHOT CAPTURE');
  console.log('===============================================================');

  // Launch headless Chrome with CDP
  const tempProfileDir = path.join(process.env.TEMP || 'C:\\Temp', 'chrome-cdp-phase5-' + Date.now());
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    `--user-data-dir=${tempProfileDir}`
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9223/json');
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    if (!pageTarget) throw new Error('No page target found');

    const cdp = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    console.log('✅ Connected to Chrome CDP session on port 9223');

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    const shots = [
      {
        name: 'phase5_01_comparison_matrix_desktop_1440px_en.png',
        url: 'http://127.0.0.1:5000/?view=compare&lang=en',
        width: 1440,
        height: 900
      },
      {
        name: 'phase5_02_comparison_matrix_desktop_1440px_or.png',
        url: 'http://127.0.0.1:5000/?view=compare&lang=or',
        width: 1440,
        height: 900
      },
      {
        name: 'phase5_03_comparison_matrix_desktop_1440px_hi.png',
        url: 'http://127.0.0.1:5000/?view=compare&lang=hi',
        width: 1440,
        height: 900
      },
      {
        name: 'phase5_04_comparison_tablet_820px_en.png',
        url: 'http://127.0.0.1:5000/?view=compare&lang=en',
        width: 820,
        height: 1180
      },
      {
        name: 'phase5_05_comparison_mobile_375px_or.png',
        url: 'http://127.0.0.1:5000/?view=compare&lang=or',
        width: 375,
        height: 812
      },
      {
        name: 'phase5_06_analytics_dashboard_desktop_1440px_en.png',
        url: 'http://127.0.0.1:5000/?view=staff&tab=analytics&autoUser=admin&lang=en',
        width: 1440,
        height: 950
      },
      {
        name: 'phase5_07_analytics_dashboard_desktop_1440px_or.png',
        url: 'http://127.0.0.1:5000/?view=staff&tab=analytics&autoUser=admin&lang=or',
        width: 1440,
        height: 950
      },
      {
        name: 'phase5_08_analytics_dashboard_desktop_1440px_hi.png',
        url: 'http://127.0.0.1:5000/?view=staff&tab=analytics&autoUser=admin&lang=hi',
        width: 1440,
        height: 950
      },
      {
        name: 'phase5_09_analytics_tablet_820px_en.png',
        url: 'http://127.0.0.1:5000/?view=staff&tab=analytics&autoUser=admin&lang=en',
        width: 820,
        height: 1180
      },
      {
        name: 'phase5_10_analytics_mobile_375px_hi.png',
        url: 'http://127.0.0.1:5000/?view=staff&tab=analytics&autoUser=admin&lang=hi',
        width: 375,
        height: 812
      }
    ];

    for (const s of shots) {
      process.stdout.write(`📸 Capturing ${s.name} (${s.width}x${s.height})... `);

      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: s.width,
        height: s.height,
        deviceScaleFactor: 1,
        mobile: s.width < 768
      });

      await cdp.send('Page.navigate', { url: s.url });
      // Allow React component rendering and API data fetch
      await new Promise((r) => setTimeout(r, 1600));

      const shotRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(shotRes.data, 'base64');

      const artifactPath = path.join(ARTIFACT_DIR, s.name);
      const docsPath = path.join(DOCS_EVIDENCE_DIR, s.name);

      fs.writeFileSync(artifactPath, buffer);
      fs.writeFileSync(docsPath, buffer);
      console.log(`✅ SAVED (${(buffer.length / 1024).toFixed(1)} KB)`);
    }

    cdp.close();
    chromeProc.kill();
    console.log('\n🎉 ALL 10 PHASE 5 HIGH-RES SCREENSHOTS SUCCESSFULLY CAPTURED!');
    process.exit(0);
  } catch (err) {
    console.error('CDP capture error:', err);
    chromeProc.kill();
    process.exit(1);
  }
}

capturePhase5();