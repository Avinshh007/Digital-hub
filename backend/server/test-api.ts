// server/test-api.ts
import { prisma } from './db';
import { hashPassword } from './auth';
import assert from 'assert';
import http from 'http';

// We import the express app by running the server file or booting it
// Since server.ts directly starts the server, we can boot it in a child process
// or run it locally by mocking request/response.
// To make it easy, we can start a test server dynamically by extracting the app.
// But server.ts calls app.listen() directly at the bottom.
// We can start a process to run the server, or we can run the test against a running local instance.
// Let's boot server.ts on a specific port (e.g. 3002) in the background.

import { exec, ChildProcess } from 'child_process';
import path from 'path';

async function runTests() {
  console.log('--- Starting Backend Integration Tests ---');
  
  const testEmail = `test_admin_${Date.now()}@  DIGITAL HUB.com`;
  const testPassword = 'SecurePassword123!';
  const passwordHash = hashPassword(testPassword);

  // Pre-cleanup of any stray records from previous failed runs
  console.log('Cleaning up any stray records from previous runs...');
  await prisma.product.deleteMany({
    where: { sku: { in: ['TEST-SKU-A', 'TEST-SKU-B'] } }
  });
  await prisma.importHistory.deleteMany({
    where: { filename: { in: ['test-tally.csv', 'test-tally-update.csv'] } }
  });

  console.log(`Creating test admin user: ${testEmail}...`);
  const adminUser = await prisma.user.create({
    data: {
      email: testEmail,
      name: 'Test Admin',
      passwordHash,
      role: 'ADMIN'
    }
  });

  let serverProcess: ChildProcess | null = null;
  const testPort = 3002;

  try {
    // 2. Start the Express server on port 3002
    console.log('Booting test Express server on port 3002...');
    serverProcess = exec(`npx ts-node --project ${path.join(__dirname, '../tsconfig.json')} ${path.join(__dirname, 'server.ts')}`, {
      env: {
        ...process.env,
        PORT: String(testPort),
        NODE_ENV: 'test'
      }
    });

    serverProcess.stdout?.on('data', data => console.log(`[Server Out]: ${data.toString().trim()}`));
    serverProcess.stderr?.on('data', data => console.error(`[Server Err]: ${data.toString().trim()}`));

    // Wait for server to start by polling /api/health
    console.log('Waiting for test server to be ready...');
    let serverReady = false;
    let initialCookies = '';
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`http://localhost:${testPort}/api/health`);
        if (res.status === 200 || res.status === 500) {
          serverReady = true;
          initialCookies = res.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
          break;
        }
      } catch (e) {
        // Ignored, server not up yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    if (!serverReady) {
      throw new Error('Test server failed to start within 30 seconds');
    }
    console.log('Test server is ready!');

    const allCookiesMap = new Map<string, string>();
    const parseCookies = (str: string) => {
      if (!str) return;
      str.split(';').forEach(c => {
        const [k, v] = c.split('=');
        if (k && v) allCookiesMap.set(k.trim(), v.trim());
      });
    };
    parseCookies(initialCookies);
    const initialXsrfToken = allCookiesMap.get('XSRF-TOKEN') || '';

    // 3. Login to get session cookies
    console.log('Logging in test admin...');
    const loginRes = await fetch(`http://localhost:${testPort}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': initialCookies,
        'x-xsrf-token': initialXsrfToken
      },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });

    assert.strictEqual(loginRes.status, 200, 'Login should succeed');
    
    // Capture cookies
    const loginCookies = loginRes.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
    parseCookies(loginCookies);
    
    const cookies = Array.from(allCookiesMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Cookie': cookies,
      'x-xsrf-token': allCookiesMap.get('XSRF-TOKEN') || ''
    };

    console.log('Authenticated successfully. Testing import preview (dry run)...');

    // 4. Test Tally Import Preview (Dry Run)
    const mockProducts = [
      {
        sku: 'TEST-SKU-A',
        name: 'Test Product A',
        category: 'Processors',
        brand: 'Intel',
        price: 250,
        originalPrice: 300,
        stock: 10,
        description: 'Test A specs'
      },
      {
        sku: 'TEST-SKU-B',
        name: 'Test Product B',
        category: 'Motherboards',
        brand: 'ASUS',
        price: 150,
        originalPrice: 180,
        stock: 5,
        description: 'Test B specs'
      }
    ];

    const previewRes = await fetch(`http://localhost:${testPort}/api/products/import/preview`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({ products: mockProducts, mode: 'CREATE_AND_UPDATE', source: 'TALLY_IMPORT' })
    });

    assert.strictEqual(previewRes.status, 200, 'Preview endpoint should succeed');
    const previewData = await previewRes.json() as any;
    console.log(`Preview summary: Created=${previewData.summary.created}, Updated=${previewData.summary.updated}`);
    assert.strictEqual(previewData.summary.created, 2, 'Should plan to create 2 products');

    // 5. Test Tally Import Commit
    console.log('Committing bulk import...');
    const importRes = await fetch(`http://localhost:${testPort}/api/products/import`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({ products: mockProducts, mode: 'CREATE_AND_UPDATE', source: 'TALLY_IMPORT', filename: 'test-tally.csv' })
    });

    assert.strictEqual(importRes.status, 200, 'Import commit should succeed');
    const importData = await importRes.json() as any;
    console.log(`Import result: Created=${importData.summary.created}, Updated=${importData.summary.updated}`);
    assert.strictEqual(importData.summary.created, 2, 'Should have created 2 products');

    // Verify database entries exist
    const prodA = await prisma.product.findUnique({ where: { sku: 'TEST-SKU-A' } });
    assert.ok(prodA, 'Product A should exist in DB');
    assert.strictEqual(prodA.price, 250, 'Product A price should match');

    // 6. Test Tally Import Update (Update Price & Stock)
    console.log('Running import update...');
    const updatedProducts = [
      {
        sku: 'TEST-SKU-A',
        name: 'Test Product A Updated',
        category: 'Processors',
        brand: 'Intel',
        price: 280, // Updated price
        originalPrice: 300,
        stock: 12,  // Updated stock
        description: 'Test A specs updated'
      }
    ];

    const updateRes = await fetch(`http://localhost:${testPort}/api/products/import`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({ products: updatedProducts, mode: 'CREATE_AND_UPDATE', source: 'TALLY_IMPORT', filename: 'test-tally-update.csv' })
    });

    assert.strictEqual(updateRes.status, 200, 'Import update should succeed');
    
    // Fetch import history log to get rollback target ID
    console.log('Fetching import history...');
    const historyRes = await fetch(`http://localhost:${testPort}/api/products/import/history`, {
      headers: requestHeaders
    });
    
    assert.strictEqual(historyRes.status, 200, 'History lookup should succeed');
    const historyData = await historyRes.json() as any;
    const latestLog = historyData.history[0];
    assert.ok(latestLog, 'History logs should exist');
    assert.strictEqual(latestLog.filename, 'test-tally-update.csv', 'Latest log should match latest filename');
    
    // Verify update was applied
    const prodAUpdated = await prisma.product.findUnique({ where: { sku: 'TEST-SKU-A' } });
    assert.strictEqual(prodAUpdated?.price, 280, 'Updated price should be 280');
    assert.strictEqual(prodAUpdated?.stock, 12, 'Updated stock should be 12');

    // 7. Test Rollback of Update
    console.log(`Executing rollback for history ID: ${latestLog.id}...`);
    const rollbackRes = await fetch(`http://localhost:${testPort}/api/products/import/rollback/${latestLog.id}`, {
      method: 'POST',
      headers: requestHeaders
    });

    assert.strictEqual(rollbackRes.status, 200, 'Rollback should succeed');
    
    // Verify rollback reverted state
    const prodAReverted = await prisma.product.findUnique({ where: { sku: 'TEST-SKU-A' } });
    assert.strictEqual(prodAReverted?.price, 250, 'Price should be reverted to 250');
    assert.strictEqual(prodAReverted?.stock, 10, 'Stock should be reverted to 10');
    
    console.log('Rollback successful and validated! Reverted state matches pre-import values.');

    // 8. Test Missing Images Report
    console.log('Checking missing images audit report...');
    const missingRes = await fetch(`http://localhost:${testPort}/api/products/import/missing-images`, {
      headers: requestHeaders
    });

    assert.strictEqual(missingRes.status, 200, 'Missing images report should succeed');
    const missingData = await missingRes.json() as any;
    assert.ok(Array.isArray(missingData.missingImages), 'Missing images should return an array');
    console.log(`Products holding placeholder/missing images count: ${missingData.missingImages.length}`);

    // 9. Test Auto Assign Images Endpoint
    console.log('Testing bulk auto-assign product images...');
    const prodABefore = await prisma.product.findUnique({ where: { sku: 'TEST-SKU-A' } });
    assert.ok(prodABefore?.images.includes('hero_banner.jpg'), 'Product A should initially have placeholder image');

    const autoAssignRes = await fetch(`http://localhost:${testPort}/api/products/import/auto-assign-images`, {
      method: 'POST',
      headers: requestHeaders
    });

    assert.strictEqual(autoAssignRes.status, 200, 'Auto-assign images endpoint should succeed');
    const autoAssignData = await autoAssignRes.json() as any;
    assert.ok(autoAssignData.summary, 'Should return summary info');
    assert.ok(autoAssignData.summary.assigned > 0, 'Should have assigned at least 1 image');

    const prodAAfter = await prisma.product.findUnique({ where: { sku: 'TEST-SKU-A' } });
    assert.ok(prodAAfter?.images.includes('images.unsplash.com'), 'Product A images should now contain an Unsplash URL');
    console.log(`Auto-assign successful! New image for Product A: ${prodAAfter?.images}`);

    console.log('--- ALL BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY! ---');

  } catch (err: any) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    // Cleanup Database
    console.log('Cleaning up database test entries...');
    await prisma.product.deleteMany({
      where: { sku: { in: ['TEST-SKU-A', 'TEST-SKU-B'] } }
    });
    await prisma.importHistory.deleteMany({
      where: { filename: { in: ['test-tally.csv', 'test-tally-update.csv'] } }
    });
    await prisma.user.delete({
      where: { id: adminUser.id }
    });
    
    // Terminate server process
    if (serverProcess) {
      console.log('Stopping test Express server...');
      if (process.platform === 'win32') {
        try {
          const { execSync } = require('child_process');
          execSync(`taskkill /F /T /PID ${serverProcess.pid}`, { stdio: 'ignore' });
        } catch (e) {
          serverProcess.kill();
        }
      } else {
        serverProcess.kill('SIGINT');
      }
    }
    await prisma.$disconnect();
    process.exit(0);
  }
}

runTests();
