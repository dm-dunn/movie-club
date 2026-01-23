import { prisma } from '../lib/prisma';

async function main() {
  console.log('\n📊 Checking Users Table Schema\n');
  console.log('=' .repeat(80));

  try {
    // Query all users using raw SQL
    const users = await prisma.$queryRaw<any[]>`SELECT * FROM users LIMIT 5`;

    if (users.length > 0) {
      console.log('Sample user data:');
      console.log(JSON.stringify(users[0], null, 2));
      console.log('\nColumns:', Object.keys(users[0]).join(', '));
    } else {
      console.log('No users found');
    }

    console.log('\n' + '='.repeat(80));
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
