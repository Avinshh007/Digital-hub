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
import fs from 'fs';

async function runTests() {
  console.log('--- Starting Backend Integration Tests ---');
  console.log('[Test Client Startup] DATABASE_URL:', process.env.DATABASE_URL);
  
  const testEmail = `test_admin_${Date.now()}@digitalhub.com`;
  const testPassword = 'SecurePassword123!';
  const passwordHash = hashPassword(testPassword);

  // Pre-cleanup of any stray records from previous failed runs
  console.log('Cleaning up any stray records from previous runs...');
  try {
    const strayUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { startsWith: 'test_admin_' } },
          { email: { startsWith: 'otp_signup_' } },
          { email: { startsWith: 'rate_limit_' } }
        ]
      }
    });
    const strayUserIds = strayUsers.map(u => u.id);
    await prisma.orderItem.deleteMany({
      where: {
        OR: [
          { order: { userId: { in: strayUserIds } } },
          { product: { sku: { in: ['TEST-SKU-A', 'TEST-SKU-B'] } } }
        ]
      }
    });
    await prisma.order.deleteMany({
      where: { userId: { in: strayUserIds } }
    });
    await prisma.user.deleteMany({
      where: { id: { in: strayUserIds } }
    });
  } catch (err: any) {
    console.log('Pre-cleanup error (ignored):', err.message);
  }

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

  const allUsersInTestClient = await prisma.user.findMany();
  console.log('[Test Client Debug] All users in DB:', allUsersInTestClient.map(u => u.email));

  let serverProcess: ChildProcess | null = null;
  const testPort = 3002;
  let rateLimitEmail = '';
  let signupEmail = '';

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

    function getLatestOtpFromLog(emailAddress: string): string {
      const logPath = path.resolve(process.cwd(), 'email_messages.log');
      if (!fs.existsSync(logPath)) return '';
      const fileContent = fs.readFileSync(logPath, 'utf8');
      const blocks = fileContent.split('To: ' + emailAddress);
      if (blocks.length < 2) return '';
      const lastBlock = blocks[blocks.length - 1];
      const match = lastBlock.match(/(?:code|otp)\b.*?(\d{6})/i) || lastBlock.match(/\b\d{6}\b/);
      return match ? (match[1] || match[0]) : '';
    }

    // Guest headers containing CSRF token to pass protection checks on public POST endpoints
    const guestHeaders = {
      'Content-Type': 'application/json',
      'Cookie': initialCookies,
      'x-xsrf-token': initialXsrfToken
    };

    // 10. Test OTP Rate Limiting
    console.log('Testing OTP rate limits...');
    rateLimitEmail = `rate_limit_${Date.now()}@test.com`;
    // 3 successful requests
    for (let i = 0; i < 3; i++) {
      const regRes = await fetch(`http://localhost:${testPort}/api/auth/register`, {
        method: 'POST',
        headers: guestHeaders,
        body: JSON.stringify({ name: 'Rate Limit User', email: rateLimitEmail, password: 'Password123' })
      });
      assert.strictEqual(regRes.status, 200, `Request ${i+1} should succeed`);
    }
    // 4th request should trigger rate limit (429)
    const limitRes = await fetch(`http://localhost:${testPort}/api/auth/register`, {
      method: 'POST',
      headers: guestHeaders,
      body: JSON.stringify({ name: 'Rate Limit User', email: rateLimitEmail, password: 'Password123' })
    });
    assert.strictEqual(limitRes.status, 429, '4th request must be rate limited (429)');
    console.log('OTP rate limit verification passed!');

    // 11. Test Complete Signup Flow using OTP Email parsing
    console.log('Testing OTP signup flow...');
    signupEmail = `otp_signup_${Date.now()}@test.com`;
    const regRes = await fetch(`http://localhost:${testPort}/api/auth/register`, {
      method: 'POST',
      headers: guestHeaders,
      body: JSON.stringify({ name: 'OTP Signup User', email: signupEmail, password: 'Password123' })
    });
    assert.strictEqual(regRes.status, 200, 'Registration OTP request should succeed');

    const latestOtp = getLatestOtpFromLog(signupEmail);
    assert.ok(latestOtp, 'OTP code should be logged to email_messages.log');
    console.log(`Extracted registration OTP code: ${latestOtp}`);

    const verifyRes = await fetch(`http://localhost:${testPort}/api/auth/verify-email`, {
      method: 'POST',
      headers: guestHeaders,
      body: JSON.stringify({ email: signupEmail, otp: latestOtp })
    });
    assert.strictEqual(verifyRes.status, 200, 'Email OTP verification should succeed');
    const verifyData = await verifyRes.json() as any;
    assert.ok(verifyData.user, 'Should return logged in user object');
    console.log('OTP signup verification passed!');

    // 12. Test Forgot Password and Reset Password Flow
    console.log('Testing password recovery OTP flow...');
    const forgotRes = await fetch(`http://localhost:${testPort}/api/auth/forgot-password`, {
      method: 'POST',
      headers: guestHeaders,
      body: JSON.stringify({ email: signupEmail })
    });
    assert.strictEqual(forgotRes.status, 200, 'Forgot password request should succeed');

    const resetOtp = getLatestOtpFromLog(signupEmail);
    assert.ok(resetOtp, 'Reset OTP code should be logged to email_messages.log');
    console.log(`Extracted reset OTP code: ${resetOtp}`);

    const resetRes = await fetch(`http://localhost:${testPort}/api/auth/reset-password`, {
      method: 'POST',
      headers: guestHeaders,
      body: JSON.stringify({ email: signupEmail, otp: resetOtp, newPassword: 'NewPasswordSecure123' })
    });
    assert.strictEqual(resetRes.status, 200, 'Password reset verification should succeed');
    console.log('Password reset verification passed!');

    // 13. Test Login Customer to obtain Session Cookies
    console.log('Logging in customer...');
    const custLoginRes = await fetch(`http://localhost:${testPort}/api/auth/login`, {
      method: 'POST',
      headers: guestHeaders,
      body: JSON.stringify({ email: signupEmail, password: 'NewPasswordSecure123' })
    });
    assert.strictEqual(custLoginRes.status, 200, 'Customer login should succeed');
    
    const customerCookiesMap = new Map<string, string>();
    const parseIntoMap = (cookieStr: string, map: Map<string, string>) => {
      if (!cookieStr) return;
      cookieStr.split(';').forEach(c => {
        const [k, v] = c.split('=');
        if (k && v) map.set(k.trim(), v.trim());
      });
    };
    parseIntoMap(initialCookies, customerCookiesMap);
    const custLoginCookiesStr = custLoginRes.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
    parseIntoMap(custLoginCookiesStr, customerCookiesMap);

    const customerCookies = Array.from(customerCookiesMap.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
    const customerHeaders = {
      'Content-Type': 'application/json',
      'Cookie': customerCookies,
      'x-xsrf-token': customerCookiesMap.get('XSRF-TOKEN') || ''
    };

    // 14. Test COD Order creation
    const productA = await prisma.product.findUnique({ where: { sku: 'TEST-SKU-A' } });
    assert.ok(productA, 'Product A should exist');

    const codOrderPayload = {
      items: [
        {
          productId: productA.id,
          quantity: 1,
          price: productA.price
        }
      ],
      shippingAddress: {
        fullName: 'John Doe',
        street: '123 Main St',
        city: 'Bangalore',
        state: 'Karnataka',
        pinCode: '560001',
        phone: '9876543210'
      },
      paymentMethod: 'COD'
    };

    console.log('Placing COD order...');
    const codRes = await fetch(`http://localhost:${testPort}/api/orders`, {
      method: 'POST',
      headers: customerHeaders,
      body: JSON.stringify(codOrderPayload)
    });
    assert.strictEqual(codRes.status, 200, 'COD order creation should succeed');
    const codOrderJson = await codRes.json() as any;
    const codOrder = codOrderJson.order;
    assert.ok(codOrder && codOrder.id, 'Should return order object with ID');
    console.log(`COD Order placed successfully: ID=${codOrder.id}`);

    // Verify COD order confirmation and admin alert emails
    const emailLogPath = path.resolve(process.cwd(), 'email_messages.log');
    const logContentAfterCod = fs.readFileSync(emailLogPath, 'utf8');
    assert.ok(logContentAfterCod.includes(`To: ${signupEmail}`), 'Confirmation email should be logged to customer');
    assert.ok(logContentAfterCod.includes(`Subject: Order Confirmation`), 'Order confirmation email subject should be logged');
    assert.ok(logContentAfterCod.includes(`To: ${testEmail}`), 'Admin alert email should be logged to test admin');
    console.log('COD order email alerts verified successfully.');

    // 15. Test Online Payment verification flow
    console.log('Testing online payment checkout flow...');
    const razorpayOrderId = 'order_test_razorpay_12345';
    const razorpayPaymentId = 'pay_test_razorpay_67890';
    
    const crypto = require('crypto');
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_  DIGITAL HUBelectronics';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const signature = hmac.digest('hex');

    const onlineOrderPayload = {
      items: [
        {
          productId: productA.id,
          quantity: 1,
          price: productA.price
        }
      ],
      shippingAddress: {
        fullName: 'Jane Doe',
        street: '456 Tech Park',
        city: 'Bangalore',
        state: 'Karnataka',
        pinCode: '560002',
        phone: '9876543211'
      },
      paymentMethod: 'ONLINE'
    };

    const verifyPaymentRes = await fetch(`http://localhost:${testPort}/api/payments/verify`, {
      method: 'POST',
      headers: customerHeaders,
      body: JSON.stringify({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: signature,
        orderData: onlineOrderPayload
      })
    });
    assert.strictEqual(verifyPaymentRes.status, 200, 'Online payment verification should succeed');
    const onlineOrderJson = await verifyPaymentRes.json() as any;
    const onlineOrder = onlineOrderJson.order;
    assert.ok(onlineOrder && onlineOrder.id, 'Should return order object with ID');
    assert.strictEqual(onlineOrder.paymentStatus, 'COMPLETED', 'Payment status should be COMPLETED');
    console.log(`Online Order placed successfully: ID=${onlineOrder.id}`);

    // Verify online order emails are logged
    const logContentAfterOnline = fs.readFileSync(emailLogPath, 'utf8');
    assert.ok(logContentAfterOnline.includes('Subject: Payment Successful'), 'Payment success subject should be logged');
    assert.ok(logContentAfterOnline.includes(razorpayPaymentId), 'Razorpay payment ID should be in the log');
    console.log('Online order payment emails verified successfully.');

    // 16. Test Admin update order status with Courier Name
    console.log('Testing admin order fulfillment update with Courier Name...');
    const updateOrderRes = await fetch(`http://localhost:${testPort}/api/orders/${codOrder.id}`, {
      method: 'PUT',
      headers: requestHeaders,
      body: JSON.stringify({
        status: 'SHIPPED',
        trackingNumber: 'TRACK123456789',
        courierName: 'Delhivery'
      })
    });
    assert.strictEqual(updateOrderRes.status, 200, 'Admin update order should succeed');
    const updatedOrderDetails = await updateOrderRes.json() as any;
    const updatedOrder = updatedOrderDetails.order;
    assert.ok(updatedOrder, 'Response should contain order object');
    assert.strictEqual(updatedOrder.status, 'SHIPPED', 'Order status should be updated to SHIPPED');
    assert.strictEqual(updatedOrder.trackingNumber, 'TRACK123456789', 'Tracking number should be updated');
    assert.strictEqual(updatedOrder.courierName, 'Delhivery', 'Courier Name should be updated');

    // Verify order status update email is logged
    const logContentAfterFulfillment = fs.readFileSync(emailLogPath, 'utf8');
    assert.ok(logContentAfterFulfillment.includes('Subject: Order #'), 'Status update subject should be logged');
    assert.ok(logContentAfterFulfillment.includes('Delhivery'), 'Courier Name Delhivery should be in the log');
    assert.ok(logContentAfterFulfillment.includes('TRACK123456789'), 'Tracking number should be in the log');
    console.log('Fulfillment courier name and status updates verification passed!');

    console.log('--- ALL BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY! ---');

  } catch (err: any) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    // Cleanup Database
    console.log('Cleaning up database test entries...');
    try {
      const testUsers = await prisma.user.findMany({
        where: { email: { in: [testEmail, rateLimitEmail, signupEmail] } }
      });
      const testUserIds = testUsers.map(u => u.id);

      await prisma.orderItem.deleteMany({
        where: { order: { userId: { in: testUserIds } } }
      });
      await prisma.order.deleteMany({
        where: { userId: { in: testUserIds } }
      });
    } catch (cleanupErr: any) {
      console.error('Failed to cleanup orders:', cleanupErr.message);
    }

    await prisma.product.deleteMany({
      where: { sku: { in: ['TEST-SKU-A', 'TEST-SKU-B'] } }
    });
    await prisma.importHistory.deleteMany({
      where: { filename: { in: ['test-tally.csv', 'test-tally-update.csv'] } }
    });
    await prisma.user.deleteMany({
      where: { email: { in: [testEmail, rateLimitEmail, signupEmail] } }
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
