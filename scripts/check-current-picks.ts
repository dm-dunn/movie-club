import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  console.log('\n🎬 Current Season Picks Status\n');
  console.log('=' .repeat(80));

  // Get active season
  const activeSeason = await prisma.pickingSeason.findFirst({
    where: { isActive: true },
  });

  if (!activeSeason) {
    console.log('❌ No active season found');
    return;
  }

  console.log(`Season Number: ${activeSeason.seasonNumber}`);
  console.log(`Status: ${activeSeason.completedAt ? 'Completed' : 'Active'}\n`);

  // Get current pickers (those in availablePickerIds)
  console.log('📋 CURRENT PICKERS (Can pick now):');
  console.log('-'.repeat(80));

  if (activeSeason.availablePickerIds.length === 0) {
    console.log('  (None - all have picked!)');
  } else {
    for (const userId of activeSeason.availablePickerIds) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      // Check if they've picked yet
      const pick = await prisma.moviePick.findFirst({
        where: {
          userId: userId,
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
        console.log(`  ✅ ${user?.name} - Picked: ${pick.movie.title} (${pick.movie.year})`);
      } else {
        console.log(`  ⏳ ${user?.name} - Not picked yet`);
      }
    }
  }

  // Show who has already been revealed/moved to used
  console.log('\n✅ REVEALED PICKERS (Already moved to used):');
  console.log('-'.repeat(80));

  if (activeSeason.usedPickerIds.length === 0) {
    console.log('  (None yet)');
  } else {
    for (const userId of activeSeason.usedPickerIds) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      const pick = await prisma.moviePick.findFirst({
        where: {
          userId: userId,
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
        ? `${pick.movie.title} (${pick.movie.year})`
        : 'No pick found';
      console.log(`  • ${user?.name} - ${movieInfo}`);
    }
  }

  // Summary
  const totalInAvailable = activeSeason.availablePickerIds.length;
  let pickedCount = 0;

  for (const userId of activeSeason.availablePickerIds) {
    const pick = await prisma.moviePick.findFirst({
      where: {
        userId: userId,
        pickRound: activeSeason.seasonNumber,
      },
    });
    if (pick) pickedCount++;
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY:');
  console.log(`   • Current group size: ${totalInAvailable}`);
  console.log(`   • Have picked: ${pickedCount}/${totalInAvailable}`);
  console.log(`   • Not picked yet: ${totalInAvailable - pickedCount}`);
  console.log(`   • Already revealed: ${activeSeason.usedPickerIds.length}`);

  if (pickedCount === totalInAvailable && totalInAvailable > 0) {
    console.log('\n   ✅ All current pickers have picked! Ready to reveal.');
    console.log('   Run: POST /api/admin/season/reveal-picks');
  }

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
