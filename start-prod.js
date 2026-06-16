const { execSync } = require('child_process');

console.log('[Start Prod] Running database migrations...');
try {
  // Synchronize the prisma schema with PostgreSQL database
  execSync('npx prisma db push --schema backend/prisma/schema.prisma --accept-data-loss', { stdio: 'inherit' });
  console.log('[Start Prod] Database schema synchronized.');
} catch (e) {
  console.error('[Start Prod] Warning: Prisma db push encountered an issue:', e.message || e);
}

console.log('[Start Prod] Starting applications via concurrently...');
try {
  execSync('npx concurrently "node backend/dist/server/server.js" "node frontend/dist/ecommers/server/server.mjs"', { stdio: 'inherit' });
} catch (e) {
  console.error('[Start Prod] Process terminated:', e.message || e);
}
