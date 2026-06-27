import { prisma } from './db';

async function main() {
  try {
    const users = await prisma.user.findMany();
    console.log('--- DATABASE USERS LIST ---');
    console.log(JSON.stringify(users, null, 2));
  } catch (e: any) {
    console.error('Error querying DB:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
