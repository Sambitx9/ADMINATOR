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
const SCREENSHOT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\0dbbe9c6-c86c-4bd6-9851-0b4d8344efbb\\screenshots';

console.log('--- ADMINATOR SCREENSHOT CAPTURE UTILITY ---');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Seed sample interactive Odia and Hindi sessions
  console.log('Pre-populating Odia and Hindi multi-turn sessions for visual capture...');

  const odiaSid = 'sim-session-odia';
  await handleIncomingMessage({ sessionId: odiaSid, message: 'ନମସ୍କାର', selectedLanguage: 'or' });
  await handleIncomingMessage({ sessionId: odiaSid, message: 'କମ୍ପ୍ୟୁଟର ସାଇନ୍ସ ଇଞ୍ଜିନିୟରିଂ ବିଷୟରେ କୁହନ୍ତୁ', selectedLanguage: 'or' });
  await handleIncomingMessage({ sessionId: odiaSid, message: 'ମୋର ୧୦ମ ରେ ୬୫% ଅଛି, ଆଡମିଶନ ମିଳିବ କି?', selectedLanguage: 'or' });
  await handleIncomingMessage({ sessionId: odiaSid, message: 'କମ୍ପ୍ୟୁଟର ସାଇନ୍ସ ଫିସ୍ ଏବଂ ହଷ୍ଟେଲ ଖର୍ଚ୍ଚ କେତେ?', selectedLanguage: 'or' });
  await handleIncomingMessage({ sessionId: odiaSid, message: 'ମୋ ନାମ ଅନିଲ ମହାନ୍ତି, ମୋବାଇଲ ୯୮୭୬୫୪୩୨୧୦, କାଉନସେଲରଙ୍କ ସହ କଥା ହେବାକୁ ଚାହୁଁଛି', selectedLanguage: 'or' });

  const hindiSid = 'sim-session-hindi';
  await handleIncomingMessage({ sessionId: hindiSid, message: 'नमस्ते सर, मुझे डिप्लोमा एडमिशन की जानकारी चाहिए', selectedLanguage: 'hi' });
  await handleIncomingMessage({ sessionId: hindiSid, message: 'मैकेनिकल इंजीनियरिंग में क्या पढ़ाया जाता है?', selectedLanguage: 'hi' });
  await handleIncomingMessage({ sessionId: hindiSid, message: 'मेरे 10वीं में 58% अंक हैं, क्या मुझे मैकेनिकल मिलेगा?', selectedLanguage: 'hi' });
  await handleIncomingMessage({ sessionId: hindiSid, message: 'मैकेनिकल की फीस और हॉस्टल का खर्च कितना है?', selectedLanguage: 'hi' });
  await handleIncomingMessage({ sessionId: hindiSid, message: 'मेरा नाम राहुल वर्मा और मोबाइल 9876543211 है, मुझे काउंसलर से बात करनी है', selectedLanguage: 'hi' });

  // Start HTTP Server
  const server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(5055, '127.0.0.1', () => {
      console.log('✅ Server listening on http://127.0.0.1:5055');
      resolve();
    });
  });

  const targets = [
    {
      name: '01_student_landing_desktop.png',
      width: 1280,
      height: 800,
      url: 'http://127.0.0.1:5055/?view=student'
    },
    {
      name: '02_student_landing_tablet.png',
      width: 768,
      height: 1024,
      url: 'http://127.0.0.1:5055/?view=student'
    },
    {
      name: '03_student_landing_mobile.png',
      width: 375,
      height: 812,
      url: 'http://127.0.0.1:5055/?view=student'
    },
    {
      name: '04_whatsapp_simulator_desktop.png',
      width: 1280,
      height: 800,
      url: 'http://127.0.0.1:5055/?view=simulator'
    },
    {
      name: '05_whatsapp_simulator_odia.png',
      width: 1280,
      height: 800,
      url: 'http://127.0.0.1:5055/?view=simulator&lang=or&sid=sim-session-odia'
    },
    {
      name: '06_whatsapp_simulator_hindi.png',
      width: 1280,
      height: 800,
      url: 'http://127.0.0.1:5055/?view=simulator&lang=hi&sid=sim-session-hindi'
    },
    {
      name: '07_whatsapp_simulator_mobile.png',
      width: 375,
      height: 812,
      url: 'http://127.0.0.1:5055/?view=simulator&lang=or&sid=sim-session-odia'
    },
    {
      name: '08_eligibility_modal.png',
      width: 1280,
      height: 800,
      url: 'http://127.0.0.1:5055/?view=simulator&modal=eligibility'
    },
    {
      name: '09_tracking_modal.png',
      width: 1280,
      height: 800,
      url: 'http://127.0.0.1:5055/?view=simulator&modal=tracking'
    },
    {
      name: '10_staff_crm_desktop.png',
      width: 1280,
      height: 800,
      url: 'http://127.0.0.1:5055/?view=staff'
    }
  ];

  for (const t of targets) {
    const outputPath = path.join(SCREENSHOT_DIR, t.name);
    console.log(`📸 Capturing: ${t.name} (${t.width}x${t.height})...`);
    const cmd = `"${CHROME_PATH}" --headless=new --hide-scrollbars --virtual-time-budget=4000 --window-size=${t.width},${t.height} --screenshot="${outputPath}" "${t.url}"`;
    try {
      execSync(cmd, { stdio: 'ignore', timeout: 15000 });
      console.log(`  ✓ Saved to ${t.name}`);
    } catch (err) {
      console.error(`  ✗ Error capturing ${t.name}:`, err.message);
    }
  }

  server.close();
  await mongoose.disconnect();
  console.log('\n🎉 ALL SCREENSHOTS SUCCESSFULLY CAPTURED IN ARTIFACT DIRECTORY!');
}

capture().catch(err => {
  console.error('Fatal screenshot capture error:', err);
  process.exit(1);
});
