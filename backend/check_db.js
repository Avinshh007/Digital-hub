const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

async function check() {
  try {
    const users = await prisma.user.findMany();
    console.log('--- USERS IN dev.db ---');
    console.log(JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('Error reading SQLite:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
