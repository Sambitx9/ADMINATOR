import http from 'node:http';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

const PORT = 5055;
const TARGET_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\0dbbe9c6-c86c-4bd6-9851-0b4d8344efbb\\screenshots';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('[1/4] Connecting DB...');
  await connectDB();

  console.log('[2/4] Starting server on port', PORT);
  const server = app.listen(PORT);
  await wait(1500);

  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  const tasks = [
    {
      name: 'student_landing_desktop.png',
      url: `http://127.0.0.1:${PORT}/?view=student&lang=en`,
      size: '1280,800'
    },
    {
      name: 'student_landing_mobile.png',
      url: `http://127.0.0.1:${PORT}/?view=student&lang=or`,
      size: '375,812'
    },
    {
      name: 'whatsapp_simulator_odia.png',
      url: `http://127.0.0.1:${PORT}/?view=simulator&lang=or`,
      size: '1280,800'
    },
    {
      name: 'whatsapp_simulator_hindi.png',
      url: `http://127.0.0.1:${PORT}/?view=simulator&lang=hi`,
      size: '1280,800'
    },
    {
      name: 'eligibility_modal.png',
      url: `http://127.0.0.1:${PORT}/?view=simulator&modal=eligibility`,
      size: '1280,800'
    },
    {
      name: 'tracking_modal.png',
      url: `http://127.0.0.1:${PORT}/?view=simulator&modal=tracking`,
      size: '1280,800'
    }
  ];

  console.log('[3/4] Taking screenshots with Chrome headless...');
  for (const t of tasks) {
    const outPath = path.join(TARGET_DIR, t.name);
    console.log(`Capturing ${t.name} from ${t.url} (${t.size})...`);
    const cmd = `cmd.exe /c ""C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless=new --disable-gpu --no-sandbox --hide-scrollbars --window-size=${t.size} --virtual-time-budget=2000 --screenshot="${outPath}" "${t.url}""`;
    try {
      const stdout = execSync(cmd, { stdio: 'pipe', timeout: 20000 });
      console.log('Output:', stdout.toString());
      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
        console.log(`  -> SUCCESS: ${t.name} (${fs.statSync(outPath).size} bytes)`);
      } else {
        console.error(`  -> FAILED: file empty or missing for ${t.name}`);
      }
    } catch (err) {
      console.error(`  -> ERROR capturing ${t.name}:`, err.message);
      if (err.stdout) console.log('stdout:', err.stdout.toString());
      if (err.stderr) console.log('stderr:', err.stderr.toString());
    }
  }

  console.log('[4/4] Closing server...');
  server.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
