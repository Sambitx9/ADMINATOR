const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EVIDENCE_DIR = path.resolve('D:\\ADMINATOR\\docs\\audit-evidence');
const ARTIFACT_SCREENSHOTS_DIR = path.resolve('C:\\Users\\HP\\.gemini\\antigravity\\brain\\0dbbe9c6-c86c-4bd6-9851-0b4d8344efbb\\screenshots');

[EVIDENCE_DIR, ARTIFACT_SCREENSHOTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const viewports = [
  { name: 'mobile_320x568', width: 320, height: 568, label: 'iPhone SE (320x568)' },
  { name: 'mobile_360x800', width: 360, height: 800, label: 'Standard Android (360x800)' },
  { name: 'mobile_375x812', width: 375, height: 812, label: 'iPhone Mini (375x812)' },
  { name: 'mobile_390x844', width: 390, height: 844, label: 'iPhone 12/13/14 (390x844)' },
  { name: 'mobile_430x932', width: 430, height: 932, label: 'iPhone 15 Pro Max (430x932)' },
  { name: 'tablet_portrait_768x1024', width: 768, height: 1024, label: 'iPad Portrait (768x1024)' },
  { name: 'tablet_landscape_1024x768', width: 1024, height: 768, label: 'iPad Landscape (1024x768)' },
  { name: 'laptop_1280x720', width: 1280, height: 720, label: 'Laptop HD (1280x720)' },
  { name: 'desktop_1440x900', width: 1440, height: 900, label: 'Desktop (1440x900)' },
  { name: 'desktop_fhd_1920x1080', width: 1920, height: 1080, label: 'Desktop FHD (1920x1080)' }
];

console.log('====================================================');
console.log(' ADMINATOR RESPONSIVE & FAVICON AUDIT RUNNER');
console.log(' Testing all 10 target viewports across EN, OR, HI');
console.log('====================================================\n');

const testMatrix = [
  // 1. Hero headline & layout on Student Portal
  { vp: 'mobile_320x568', url: 'http://localhost:5000/?view=student&lang=en', shot: 'responsive_01_student_320_en.png' },
  { vp: 'mobile_360x800', url: 'http://localhost:5000/?view=student&lang=or', shot: 'responsive_02_student_360_or.png' },
  { vp: 'mobile_390x844', url: 'http://localhost:5000/?view=student&lang=hi', shot: 'responsive_03_student_390_hi.png' },
  { vp: 'mobile_430x932', url: 'http://localhost:5000/?view=student&lang=en', shot: 'responsive_04_student_430_en.png' },
  { vp: 'tablet_portrait_768x1024', url: 'http://localhost:5000/?view=student&lang=or', shot: 'responsive_05_student_768_or.png' },
  { vp: 'laptop_1280x720', url: 'http://localhost:5000/?view=student&lang=en', shot: 'responsive_06_student_1280_en.png' },
  { vp: 'desktop_fhd_1920x1080', url: 'http://localhost:5000/?view=student&lang=hi', shot: 'responsive_07_student_1920_hi.png' },

  // 2. WhatsApp Simulator
  { vp: 'mobile_360x800', url: 'http://localhost:5000/?view=simulator&lang=or', shot: 'responsive_08_simulator_360_or.png' },
  { vp: 'mobile_390x844', url: 'http://localhost:5000/?view=simulator&lang=hi', shot: 'responsive_09_simulator_390_hi.png' },
  { vp: 'tablet_portrait_768x1024', url: 'http://localhost:5000/?view=simulator&lang=en', shot: 'responsive_10_simulator_768_en.png' },
  { vp: 'desktop_1440x900', url: 'http://localhost:5000/?view=simulator&lang=or', shot: 'responsive_11_simulator_1440_or.png' },

  // 3. Staff CRM Portal
  { vp: 'mobile_375x812', url: 'http://localhost:5000/?view=staff&autoUser=admin&tab=pipeline&lang=en', shot: 'responsive_12_crm_pipeline_375_en.png' },
  { vp: 'tablet_landscape_1024x768', url: 'http://localhost:5000/?view=staff&autoUser=admin&tab=pipeline&lang=or', shot: 'responsive_13_crm_pipeline_1024_or.png' },
  { vp: 'desktop_1440x900', url: 'http://localhost:5000/?view=staff&autoUser=admin&tab=students&lang=hi', shot: 'responsive_14_crm_students_1440_hi.png' }
];

const results = [];

for (const item of testMatrix) {
  const vpObj = viewports.find(v => v.name === item.vp);
  const outPath = path.join(EVIDENCE_DIR, item.shot);
  const copyPath = path.join(ARTIFACT_SCREENSHOTS_DIR, item.shot);

  const cmd = `"${CHROME_PATH}" --headless=new --disable-gpu --no-sandbox --hide-scrollbars --window-size=${vpObj.width},${vpObj.height} --virtual-time-budget=2500 --screenshot="${outPath}" "${item.url}"`;
  
  try {
    execSync(cmd, { stdio: 'pipe' });
    if (fs.existsSync(outPath)) {
      fs.copyFileSync(outPath, copyPath);
      const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
      results.push({ name: item.shot, vp: vpObj.label, status: 'PASS', sizeKb });
      console.log(`✓ [PASS] Captured ${item.shot} on ${vpObj.label} (${sizeKb} KB)`);
    } else {
      results.push({ name: item.shot, vp: vpObj.label, status: 'FAIL', error: 'File not generated' });
      console.log(`✗ [FAIL] Missing output for ${item.shot}`);
    }
  } catch (err) {
    results.push({ name: item.shot, vp: vpObj.label, status: 'ERROR', error: err.message });
    console.log(`✗ [ERROR] ${item.shot}: ${err.message}`);
  }
}

// 4. Test favicon preview page
const faviconTestHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ADMINATOR Favicon Test</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>
    body { background: #0B132B; color: #F8FAFC; font-family: sans-serif; padding: 40px; }
    h1 { font-size: 24px; color: #38BDF8; margin-bottom: 24px; }
    .grid { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-end; }
    .card { background: #101827; border: 1px solid #1E293B; border-radius: 16px; padding: 20px; text-align: center; }
    .card img { display: block; margin: 0 auto 12px; background: transparent; }
    .label { font-size: 12px; color: #94A3B8; font-family: monospace; }
  </style>
</head>
<body>
  <h1>ADMINATOR — Brand Favicon System Visual Inspection</h1>
  <div class="grid">
    <div class="card">
      <img src="http://localhost:5000/favicon-16x16.png" width="16" height="16" />
      <div class="label">favicon-16x16.png</div>
    </div>
    <div class="card">
      <img src="http://localhost:5000/favicon-32x32.png" width="32" height="32" />
      <div class="label">favicon-32x32.png</div>
    </div>
    <div class="card">
      <img src="http://localhost:5000/favicon-48x48.png" width="48" height="48" />
      <div class="label">favicon-48x48.png</div>
    </div>
    <div class="card">
      <img src="http://localhost:5000/apple-touch-icon.png" width="90" height="90" />
      <div class="label">apple-touch-icon.png (180x180)</div>
    </div>
    <div class="card">
      <img src="http://localhost:5000/android-chrome-192x192.png" width="96" height="96" />
      <div class="label">android-chrome-192x192.png</div>
    </div>
    <div class="card">
      <img src="http://localhost:5000/favicon.svg" width="96" height="96" />
      <div class="label">favicon.svg (Master Vector)</div>
    </div>
  </div>
</body>
</html>`;

const favTestFile = path.resolve('D:\\ADMINATOR\\scratch_favicon_test.html');
fs.writeFileSync(favTestFile, faviconTestHtml, 'utf8');

const favShotPath = path.join(EVIDENCE_DIR, 'responsive_15_favicon_system_audit.png');
const favCopyPath = path.join(ARTIFACT_SCREENSHOTS_DIR, 'responsive_15_favicon_system_audit.png');
try {
  execSync(`"${CHROME_PATH}" --headless=new --disable-gpu --no-sandbox --hide-scrollbars --window-size=1200,600 --screenshot="${favShotPath}" "file:///${favTestFile.replace(/\\/g, '/')}"`);
  if (fs.existsSync(favShotPath)) {
    fs.copyFileSync(favShotPath, favCopyPath);
    console.log('✓ [PASS] Captured responsive_15_favicon_system_audit.png');
  }
} catch (e) {
  console.error('Error capturing favicon audit:', e);
}
try { fs.unlinkSync(favTestFile); } catch(e) {}

console.log('\n====================================================');
console.log(` AUDIT COMPLETE: ${results.filter(r => r.status === 'PASS').length} of ${testMatrix.length} shots captured cleanly.`);
console.log('====================================================');
