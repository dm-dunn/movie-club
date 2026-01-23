import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  console.log('\n🎬 Fixing Season Order\n');
  console.log('=' .repeat(80));

  // Users who have already picked in Season 1 (including Extra Credit for Psycho and The Town)
  const usersWhoPicked = ['Alex', 'Cam', 'Dalton', 'Extra Credit', 'Hailey', 'Liam', 'Rhett'];

  // Next three users to pick - in the correct order
  const nextThreeUsers = ['Bree', 'Brooke', 'Alexis'];

  console.log('📋 Users who already picked in Season 1:');
  usersWhoPicked.forEach(name => console.log(`  ✓ ${name}`));

  console.log('\n📋 Next three users to pick (in order):');
  nextThreeUsers.forEach((name, i) => console.log(`  ${i + 1}. ${name}`));

  // Get user IDs
  const usedUsers = await prisma.user.findMany({
    where: { name: { in: usersWhoPicked } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  // Get available users in the correct order
  const availableUserIds: string[] = [];
  for (const name of nextThreeUsers) {
    const user = await prisma.user.findFirst({
      where: { name },
      select: { id: true },
    });
    if (user) {
      availableUserIds.push(user.id);
    }
  }

  console.log(`\n✓ Found ${usedUsers.length} users who picked`);
  console.log(`✓ Found ${availableUserIds.length} available users`);

  if (availableUserIds.length !== 3) {
    console.log('\n❌ Error: Could not find all next users');
    return;
  }

  // Update the active season
  const activeSeason = await prisma.pickingSeason.findFirst({
    where: { isActive: true },
  });

  if (!activeSeason) {
    console.log('\n❌ No active season found');
    return;
  }

  const usedPickerIds = usedUsers.map(u => u.id);

  console.log('\n📝 Updating season state...');

  await prisma.pickingSeason.update({
    where: { id: activeSeason.id },
    data: {
      usedPickerIds,
      availablePickerIds: availableUserIds,
      currentPickerId: availableUserIds[0], // Bree is first
    },
  });

  console.log('   ✓ Season updated successfully');

  // Verify
  const updatedSeason = await prisma.pickingSeason.findFirst({
    where: { isActive: true },
  });

  console.log('\n✅ Updated Season State:');
  console.log(`   Season Number: ${updatedSeason?.seasonNumber}`);
  console.log(`   Used Pickers: ${updatedSeason?.usedPickerIds.length}`);
  console.log(`   Available Pickers: ${updatedSeason?.availablePickerIds.length}`);

  // Show the current picker
  for (let i = 0; i < availableUserIds.length; i++) {
    const user = await prisma.user.findUnique({
      where: { id: availableUserIds[i] },
      select: { name: true },
    });
    const marker = i === 0 ? '▶' : ' ';
    console.log(`   ${marker} ${i + 1}. ${user?.name}`);
  }

  console.log('\n' + '='.repeat(80));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
