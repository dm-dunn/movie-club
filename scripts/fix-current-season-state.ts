import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  console.log('\n🎬 Fixing Current Season State\n');
  console.log('=' .repeat(80));

  // Users who have already picked in Season 1
  const usersWhoPicked = ['Alex', 'Cam', 'Dalton', 'Hailey', 'Liam', 'Rhett'];

  // Next three users to pick
  const nextThreeUsers = ['Bree', 'Brooke', 'Alexis'];

  console.log('📋 Users who already picked in Season 1:');
  usersWhoPicked.forEach(name => console.log(`  ✓ ${name}`));

  console.log('\n📋 Next three users to pick:');
  nextThreeUsers.forEach((name, i) => console.log(`  ${i + 1}. ${name}`));

  // Get user IDs
  const usedUsers = await prisma.user.findMany({
    where: { name: { in: usersWhoPicked } },
    select: { id: true, name: true },
  });

  const availableUsers = await prisma.user.findMany({
    where: { name: { in: nextThreeUsers } },
    select: { id: true, name: true },
  });

  if (usedUsers.length !== usersWhoPicked.length) {
    console.log('\n❌ Error: Could not find all users who picked');
    console.log(`Found: ${usedUsers.map(u => u.name).join(', ')}`);
    return;
  }

  if (availableUsers.length !== nextThreeUsers.length) {
    console.log('\n❌ Error: Could not find all next users');
    console.log(`Found: ${availableUsers.map(u => u.name).join(', ')}`);
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
  const availablePickerIds = availableUsers.map(u => u.id);

  console.log('\n📝 Updating season state...');

  await prisma.pickingSeason.update({
    where: { id: activeSeason.id },
    data: {
      usedPickerIds,
      availablePickerIds,
      currentPickerId: availablePickerIds[0], // Bree is first
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

  const currentPicker = await prisma.user.findUnique({
    where: { id: updatedSeason?.currentPickerId || '' },
    select: { name: true },
  });
  console.log(`   Current Picker: ${currentPicker?.name}`);

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
