const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PUBLIC_DIR = path.resolve('D:\\ADMINATOR\\frontend\\public');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// 1. Define the Master Vector SVG (512x512)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080E1E"/>
      <stop offset="50%" stop-color="#0B132B"/>
      <stop offset="100%" stop-color="#101827"/>
    </linearGradient>

    <!-- Left Wing Gradient: Deep Blue to Cyan -->
    <linearGradient id="leftWingGrad" x1="20%" y1="90%" x2="50%" y2="20%">
      <stop offset="0%" stop-color="#1D4ED8"/>
      <stop offset="60%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>

    <!-- Right Wing Gradient: Cyan to Emerald -->
    <linearGradient id="rightWingGrad" x1="50%" y1="20%" x2="80%" y2="90%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="50%" stop-color="#00F0FF"/>
      <stop offset="100%" stop-color="#10B981"/>
    </linearGradient>

    <!-- Crossbar Bridge: Luminous Teal/Emerald -->
    <linearGradient id="bridgeGrad" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="#2563EB"/>
      <stop offset="50%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#10B981"/>
    </linearGradient>

    <!-- Central Core Glow -->
    <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.35"/>
      <stop offset="60%" stop-color="#2563EB" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#0B132B" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Container Rounded Base -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  <rect x="8" y="8" width="496" height="496" rx="104" stroke="#1E293B" stroke-width="6" fill="none"/>

  <!-- Ambient Glow in the Nexus -->
  <circle cx="256" cy="270" r="160" fill="url(#centerGlow)"/>

  <!-- Geometric "A" Monograph for ADMINATOR -->
  <!-- Left Pillar / Dynamic Wing -->
  <path d="M256 82 L108 424 H176 L256 226 Z" fill="url(#leftWingGrad)"/>

  <!-- Right Pillar / Dynamic Wing -->
  <path d="M256 82 L256 226 L336 424 H404 Z" fill="url(#rightWingGrad)"/>

  <!-- Central Bridge / Admission Gateway Crossbar -->
  <path d="M168 312 H344 V356 H168 Z" fill="url(#bridgeGrad)" rx="8"/>

  <!-- Apex Star / Zero Chaos Guidance Diamond -->
  <polygon points="256,128 274,158 256,188 238,158" fill="#F8FAFC" opacity="0.95"/>
  <circle cx="256" cy="158" r="4" fill="#38BDF8"/>

  <!-- Subtle Bottom Foundation Accent (Precision Dots) -->
  <circle cx="142" cy="424" r="6" fill="#2563EB"/>
  <circle cx="256" cy="334" r="7" fill="#FFFFFF"/>
  <circle cx="370" cy="424" r="6" fill="#10B981"/>
</svg>`;

// Save favicon.svg to frontend/public/favicon.svg
fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), svgContent, 'utf8');
console.log('✓ Created frontend/public/favicon.svg');

// 2. Generate Raster PNGs using Headless Chrome
// We create a temporary HTML file that renders the SVG onto HTML5 Canvas at any size, then saves PNG.
const tempHtmlPath = path.resolve('D:\\ADMINATOR\\scratch_render_favicons.html');
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-48x48.png', size: 48 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 }
];

const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; background:transparent;">
  <div id="svgContainer" style="display:none;">${svgContent}</div>
  <script>
    window.renderToDataUrl = function(size) {
      return new Promise((resolve) => {
        const svgElement = document.querySelector('svg');
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, size, size);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src = blobURL;
      });
    };
  </script>
</body>
</html>`;

fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

// For each size, let's use a small puppeteer-free chrome headless script
// Or execute a small node script with Chrome DevTools Protocol or screenshot
const scriptPath = path.resolve('D:\\ADMINATOR\\scratch_export_icons.js');
const exportJs = `
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PUBLIC_DIR = 'D:\\\\ADMINATOR\\\\frontend\\\\public';
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-48x48.png', size: 48 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 }
];

// Start a tiny local server to serve the render HTML
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(fs.readFileSync('D:\\\\ADMINATOR\\\\scratch_render_favicons.html'));
});

server.listen(5099, '127.0.0.1', () => {
  console.log('Renderer server on 5099');
  
  // Render each size directly by taking Chrome screenshots with exact window-size
  for (const s of sizes) {
    const htmlPage = \`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: \${s.size}px; height: \${s.size}px; overflow: hidden; background: transparent; }
    svg { width: \${s.size}px; height: \${s.size}px; display: block; }
  </style>
</head>
<body>
  \${fs.readFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), 'utf8')}
</body>
</html>\`;
    const tempPage = \`D:\\\\ADMINATOR\\\\scratch_\${s.size}.html\`;
    fs.writeFileSync(tempPage, htmlPage, 'utf8');
    
    const outPng = path.join(PUBLIC_DIR, s.name);
    const cmd = \`"C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe" --headless=new --disable-gpu --no-sandbox --hide-scrollbars --window-size=\${s.size},\${s.size} --screenshot="\${outPng}" "file:///\${tempPage.replace(/\\\\/g, '/')}"\`;
    execSync(cmd, { stdio: 'inherit' });
    console.log(\`✓ Generated \${s.name} (\${s.size}x\${s.size})\`);
    try { fs.unlinkSync(tempPage); } catch(e) {}
  }

  // 3. Generate favicon.ico combining 16x16, 32x32, and 48x48 PNG buffers
  const icoPath = path.join(PUBLIC_DIR, 'favicon.ico');
  const png16 = fs.readFileSync(path.join(PUBLIC_DIR, 'favicon-16x16.png'));
  const png32 = fs.readFileSync(path.join(PUBLIC_DIR, 'favicon-32x32.png'));
  const png48 = fs.readFileSync(path.join(PUBLIC_DIR, 'favicon-48x48.png'));
  
  const images = [
    { width: 16, height: 16, buffer: png16 },
    { width: 32, height: 32, buffer: png32 },
    { width: 48, height: 48, buffer: png48 }
  ];

  // ICO header: 6 bytes
  // Directory entries: 16 bytes each (3 * 16 = 48 bytes)
  // Total header offset = 6 + 48 = 54 bytes
  let offset = 6 + (images.length * 16);
  const headerBuf = Buffer.alloc(6);
  headerBuf.writeUInt16LE(0, 0); // Reserved
  headerBuf.writeUInt16LE(1, 2); // Type 1 = ICO
  headerBuf.writeUInt16LE(images.length, 4); // Image count

  const dirBuffers = [];
  const imgBuffers = [];

  for (const img of images) {
    const dirBuf = Buffer.alloc(16);
    dirBuf.writeUInt8(img.width === 256 ? 0 : img.width, 0);
    dirBuf.writeUInt8(img.height === 256 ? 0 : img.height, 1);
    dirBuf.writeUInt8(0, 2); // Colors (0 = no palette)
    dirBuf.writeUInt8(0, 3); // Reserved
    dirBuf.writeUInt16LE(1, 4); // Color planes
    dirBuf.writeUInt16LE(32, 6); // Bits per pixel
    dirBuf.writeUInt32LE(img.buffer.length, 8); // Size of image data
    dirBuf.writeUInt32LE(offset, 12); // Offset of image data
    
    dirBuffers.push(dirBuf);
    imgBuffers.push(img.buffer);
    offset += img.buffer.length;
  }

  const finalIco = Buffer.concat([headerBuf, ...dirBuffers, ...imgBuffers]);
  fs.writeFileSync(icoPath, finalIco);
  console.log(\`✓ Generated multi-resolution favicon.ico (16, 32, 48 px, total \${finalIco.length} bytes)\`);

  // 4. Generate site.webmanifest
  const manifest = {
    name: "ADMINATOR — Smart Admissions. Zero Chaos.",
    short_name: "ADMINATOR",
    description: "AI-Assisted Multilingual Diploma Admission Enquiry and Counselling Platform",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ],
    theme_color: "#101827",
    background_color: "#0B132B",
    display: "standalone",
    start_url: "/",
    orientation: "portrait"
  };
  fs.writeFileSync(path.join(PUBLIC_DIR, 'site.webmanifest'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('✓ Created frontend/public/site.webmanifest');

  server.close();
  try { fs.unlinkSync('D:\\\\ADMINATOR\\\\scratch_render_favicons.html'); } catch(e) {}
  try { fs.unlinkSync('D:\\\\ADMINATOR\\\\scratch_export_icons.js'); } catch(e) {}
  console.log('ALL FAVICON ASSETS GENERATED SUCCESSFULLY!');
});
`;

fs.writeFileSync(scriptPath, exportJs, 'utf8');
