import http from 'node:http';
import assert from 'node:assert';
import app from '../src/app.js';

const server = http.createServer(app);
server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log('Testing server on', baseUrl);

  // 1. Root route -> React index.html
  const rootRes = await fetch(`${baseUrl}/`);
  const rootText = await rootRes.text();
  assert.ok(rootText.includes('<div id="root"></div>'), 'Root must serve React HTML shell');
  console.log('✅ Root correctly serves frontend index.html');

  // 2. API health
  const healthRes = await fetch(`${baseUrl}/api/v1/health`);
  assert.strictEqual(healthRes.status, 200);
  console.log('✅ API /api/v1/health correctly responds');

  server.close();
  console.log('🎉 Combined frontend + API integration test passed!');
});
