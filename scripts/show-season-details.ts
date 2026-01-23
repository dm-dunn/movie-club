import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  console.log('\n🎬 Picking Season Details\n');
  console.log('=' .repeat(80));

  // Get active season
  const activeSeason = await prisma.pickingSeason.findFirst({
    where: { isActive: true },
  });

  if (!activeSeason) {
    console.log('❌ No active season found');
    console.log('\nRun: npx tsx scripts/initialize-season.ts');
    console.log('Or use the admin API: POST /api/admin/season/reset');
    console.log('\n' + '='.repeat(80));
    return;
  }

  console.log(`Season Number: ${activeSeason.seasonNumber}`);
  console.log(`Created: ${activeSeason.createdAt.toLocaleString()}`);
  console.log(`Status: ${activeSeason.completedAt ? '✓ Completed' : '▶ Active'}`);

  // Get all active users
  const allUsers = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      profilePictureUrl: true,
    },
    orderBy: { name: 'asc' },
  });

  console.log(`\nTotal Active Users: ${allUsers.length}`);

  // Current picker
  if (activeSeason.currentPickerId) {
    const currentPicker = await prisma.user.findUnique({
      where: { id: activeSeason.currentPickerId },
      select: { name: true },
    });
    console.log(`\n▶ CURRENT PICKER: ${currentPicker?.name || 'Unknown'}`);
  } else {
    console.log(`\n▶ CURRENT PICKER: None (season may be complete)`);
  }

  // Available pickers (waiting to pick)
  console.log('\n📋 AVAILABLE PICKERS (Waiting to Pick):');
  console.log('-'.repeat(80));
  if (activeSeason.availablePickerIds.length === 0) {
    console.log('  (None - all have picked!)');
  } else {
    for (let i = 0; i < activeSeason.availablePickerIds.length; i++) {
      const user = await prisma.user.findUnique({
        where: { id: activeSeason.availablePickerIds[i] },
        select: { name: true },
      });
      const marker = i === 0 ? '▶' : ' ';
      const label = i === 0 ? '(CURRENT)' : `(Position ${i + 1})`;
      console.log(`  ${marker} ${i + 1}. ${user?.name} ${label}`);
    }
  }

  // Used pickers (already picked)
  console.log('\n✅ USED PICKERS (Already Picked This Season):');
  console.log('-'.repeat(80));
  if (activeSeason.usedPickerIds.length === 0) {
    console.log('  (None yet)');
  } else {
    for (let i = 0; i < activeSeason.usedPickerIds.length; i++) {
      const user = await prisma.user.findUnique({
        where: { id: activeSeason.usedPickerIds[i] },
        select: { name: true },
      });

      // Get their movie pick
      const pick = await prisma.moviePick.findFirst({
        where: {
          userId: activeSeason.usedPickerIds[i],
          pickRound: activeSeason.seasonNumber,
        },
        include: {
          movie: {
            select: { title: true, year: true },
          },
        },
        orderBy: {
          pickedAt: 'desc',
        },
      });

      const movieInfo = pick
        ? `${pick.movie.title} (${pick.movie.year || 'N/A'})`
        : 'No movie found';
      console.log(`  ${i + 1}. ${user?.name} - ${movieInfo}`);
    }
  }

  // Users not in this season's picking rotation
  const usersInSeason = new Set([
    ...activeSeason.availablePickerIds,
    ...activeSeason.usedPickerIds,
  ]);

  const usersNotInSeason = allUsers.filter(user => !usersInSeason.has(user.id));

  console.log('\n⏸️  USERS NOT IN THIS SEASON\'S PICKING ROTATION:');
  console.log('-'.repeat(80));
  if (usersNotInSeason.length === 0) {
    console.log('  (All users are in this season\'s rotation)');
  } else {
    for (const user of usersNotInSeason) {
      // Check if they have a pick for this season (from previous rounds)
      const pick = await prisma.moviePick.findFirst({
        where: {
          userId: user.id,
          pickRound: activeSeason.seasonNumber,
        },
        include: {
          movie: {
            select: { title: true, year: true },
          },
        },
        orderBy: {
          pickedAt: 'desc',
        },
      });

      if (pick) {
        const movieInfo = `${pick.movie.title} (${pick.movie.year || 'N/A'})`;
        console.log(`  • ${user.name} - Already picked: ${movieInfo}`);
      } else {
        console.log(`  • ${user.name} - Will pick in a future season`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY:');
  console.log(`   • Available to pick: ${activeSeason.availablePickerIds.length}`);
  console.log(`   • Already picked: ${activeSeason.usedPickerIds.length}`);
  console.log(`   • Not in rotation: ${usersNotInSeason.length}`);
  console.log(`   • Total active users: ${allUsers.length}`);
  console.log('='.repeat(80) + '\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
