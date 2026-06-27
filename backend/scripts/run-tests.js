// scripts/run-tests.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const prismaDir = path.resolve(__dirname, '../prisma');
const schemaPath = path.join(prismaDir, 'schema.prisma');
const backupPath = path.join(prismaDir, 'schema.prisma.bak');

console.log('--- Preparing local SQLite environment for testing ---');

// 1. Back up schema.prisma
if (fs.existsSync(backupPath)) {
  console.log('Found existing schema backup. Restoring it first...');
  fs.copyFileSync(backupPath, schemaPath);
} else {
  fs.copyFileSync(schemaPath, backupPath);
}

try {
  const sqliteEnv = {
    ...process.env,
    DATABASE_URL: 'file:./dev.db'
  };

  // 2. Modify schema.prisma for SQLite
  let schemaContent = fs.readFileSync(schemaPath, 'utf8');
  schemaContent = schemaContent.replace('provider = "postgresql"', 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, schemaContent);
  console.log('Temporary schema.prisma written with provider = "sqlite".');

  // 3. Regenerate Prisma Client
  console.log('Regenerating Prisma Client for SQLite...');
  execSync('npx prisma generate', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit', env: sqliteEnv });

  // Sync schema to SQLite db
  console.log('Syncing database schema to SQLite...');
  execSync('npx prisma db push --accept-data-loss', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit', env: sqliteEnv });

  // 4. Run the integration tests
  console.log('Running backend integration tests...');
  execSync('npx ts-node server/test-api.ts', {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: {
      ...sqliteEnv,
      PORT: '3002'
    }
  });

  console.log('Integration tests execution completed.');

} catch (error) {
  console.error('Test run failed with error:', error.message);
  process.exitCode = 1;
} finally {
  // Wait 5 seconds for server process to fully exit and release DLL file locks on Windows
  console.log('Waiting for background processes to release database file locks...');
  try {
    execSync('node -e "const start = Date.now(); while (Date.now() - start < 5000) {}"');
  } catch (e) {}

  // 5. Restore schema.prisma and regenerate client
  console.log('--- Restoring PostgreSQL Prisma configuration ---');
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, schemaPath);
    fs.unlinkSync(backupPath);
    console.log('schema.prisma restored.');
  }

  console.log('Regenerating Prisma Client for PostgreSQL...');
  let generated = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      execSync('npx prisma generate', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
      console.log('Prisma Client restored successfully.');
      generated = true;
      break;
    } catch (genError) {
      console.warn(`Attempt ${attempt}/3 failed to regenerate Prisma Client: ${genError.message}`);
      if (attempt < 3) {
        // Wait 2 more seconds before retrying
        try { execSync('node -e "const s = Date.now(); while (Date.now() - s < 2000) {}"'); } catch (e) {}
      }
    }
  }
  if (!generated) {
    console.error('Failed to regenerate Prisma Client for PostgreSQL after 3 attempts. Run "npx prisma generate" manually.');
  }
}
