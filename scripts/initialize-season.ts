import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  console.log('\n🎬 Initializing Picking Season\n');
  console.log('=' .repeat(80));

  // Get all active users
  const activeUsers = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  if (activeUsers.length === 0) {
    console.log('❌ No active users found');
    return;
  }

  console.log(`\nFound ${activeUsers.length} active users:`);
  activeUsers.forEach(user => console.log(`  - ${user.name}`));

  // Shuffle the user IDs using Fisher-Yates algorithm
  const shuffledUserIds = activeUsers.map((u) => u.id);
  for (let i = shuffledUserIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledUserIds[i], shuffledUserIds[j]] = [shuffledUserIds[j], shuffledUserIds[i]];
  }

  // Get the next 3 pickers
  const nextThreePickers = shuffledUserIds.slice(0, 3);

  // Mark current active season as completed
  await prisma.pickingSeason.updateMany({
    where: { isActive: true },
    data: {
      isActive: false,
      completedAt: new Date(),
    },
  });

  // Get the next season number
  const lastSeason = await prisma.pickingSeason.findFirst({
    orderBy: { seasonNumber: 'desc' },
  });

  const nextSeasonNumber = (lastSeason?.seasonNumber ?? 0) + 1;

  // Create new season
  const newSeason = await prisma.pickingSeason.create({
    data: {
      seasonNumber: nextSeasonNumber,
      availablePickerIds: nextThreePickers,
      usedPickerIds: [],
      currentPickerId: nextThreePickers[0],
      isActive: true,
    },
  });

  console.log('\n✅ Season initialized successfully!\n');
  console.log(`Season Number: ${newSeason.seasonNumber}`);
  console.log('\nNext 3 Pickers (in order):');

  for (let i = 0; i < nextThreePickers.length; i++) {
    const user = activeUsers.find(u => u.id === nextThreePickers[i]);
    const marker = i === 0 ? '▶' : ' ';
    console.log(`  ${marker} ${i + 1}. ${user?.name}`);
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
