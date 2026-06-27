const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function debug() {
  console.log('--- Starting Login Debugger ---');
  
  const backendDir = __dirname;
  const schemaPath = path.join(backendDir, 'prisma', 'schema.prisma');
  const backupPath = path.join(backendDir, 'prisma', 'schema.prisma.bak');
  
  console.log('Backing up schema...');
  fs.copyFileSync(schemaPath, backupPath);
  
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  schemaContent = schemaContent.replace('provider = "postgresql"', 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, schemaContent);
  
  const sqliteEnv = {
    ...process.env,
    DATABASE_URL: 'file:./dev.db'
  };

  try {
    console.log('Regenerating Prisma Client...');
    const { execSync } = require('child_process');
    execSync('npx prisma generate', { cwd: backendDir, env: sqliteEnv });
    execSync('npx prisma db push --accept-data-loss', { cwd: backendDir, env: sqliteEnv });

    // Initialize Prisma Client
    const prisma = new PrismaClient({
      datasources: { db: { url: 'file:./dev.db' } }
    });

    const testEmail = `test_debug_${Date.now()}@  DIGITAL HUB.com`;
    const password = 'Password123!';
    const passwordHash = bcrypt.hashSync(password, 10);

    console.log('Creating user in dev.db:', testEmail);
    const user = await prisma.user.create({
      data: {
        email: testEmail.toLowerCase().trim(),
        name: 'Debug User',
        passwordHash,
        role: 'ADMIN'
      }
    });

    // Boot Server
    console.log('Booting test server...');
    const serverProcess = exec('npx ts-node server/server.ts', {
      cwd: backendDir,
      env: {
        ...sqliteEnv,
        PORT: '3002',
        NODE_ENV: 'test'
      }
    });

    serverProcess.stdout.on('data', d => console.log('[Server]:', d.trim()));
    serverProcess.stderr.on('data', d => console.error('[Server Err]:', d.trim()));

    console.log('Waiting 5 seconds for server...');
    await new Promise(r => setTimeout(r, 5000));

    // Attempt login
    console.log('Sending login request...');
    const response = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password })
    });

    console.log('Response Status:', response.status);
    const body = await response.json();
    console.log('Response Body:', body);

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
    
    console.log('Stopping server...');
    if (process.platform === 'win32') {
      execSync(`taskkill /F /T /PID ${serverProcess.pid}`, { stdio: 'ignore' });
    } else {
      serverProcess.kill();
    }
  } catch (e) {
    console.error('Debug failed:', e);
  } finally {
    // Restore schema
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, schemaPath);
      fs.unlinkSync(backupPath);
      console.log('Restored schema.prisma');
      const { execSync } = require('child_process');
      try {
        execSync('npx prisma generate', { cwd: backendDir });
      } catch (genErr) {
        console.error('Prisma regenerate failed, clean manually if needed:', genErr.message);
      }
    }
  }
}

debug();
