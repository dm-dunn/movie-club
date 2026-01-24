import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  console.log('\n📺 Current Watchlist Status\n');
  console.log('=' .repeat(80));

  // Get CURRENT movies (on watchlist)
  const currentMovies = await prisma.movie.findMany({
    where: { status: 'CURRENT' },
    include: {
      moviePicks: {
        include: {
          user: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { title: 'asc' },
  });

  console.log('🎬 CURRENT WATCHLIST (Movies to watch):');
  console.log('-'.repeat(80));

  if (currentMovies.length === 0) {
    console.log('  (Empty - no movies on current watchlist)');
  } else {
    for (const movie of currentMovies) {
      const picker = movie.moviePicks[0];
      console.log(`  • ${movie.title} (${movie.year || 'N/A'})`);
      if (picker) {
        console.log(`    Picked by: ${picker.user.name}`);
      }
    }
  }

  // Get active season
  const activeSeason = await prisma.pickingSeason.findFirst({
    where: { isActive: true },
  });

  if (activeSeason) {
    console.log('\n📋 PENDING PICKS (Not revealed yet):');
    console.log('-'.repeat(80));

    let hasPendingPicks = false;

    for (const userId of activeSeason.availablePickerIds) {
      const pick = await prisma.moviePick.findFirst({
        where: {
          userId: userId,
          pickRound: activeSeason.seasonNumber,
        },
        include: {
          user: {
            select: { name: true },
          },
          movie: {
            select: { title: true, year: true },
          },
        },
        orderBy: {
          pickedAt: 'desc',
        },
      });

      if (pick) {
        hasPendingPicks = true;
        console.log(`  • ${pick.movie.title} (${pick.movie.year})`);
        console.log(`    Picked by: ${pick.user.name}`);
      }
    }

    if (!hasPendingPicks) {
      console.log('  (None - no pending picks to reveal)');
    }
  }

  // Get WATCHED movies count
  const watchedCount = await prisma.movie.count({
    where: { status: 'WATCHED' },
  });

  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY:');
  console.log(`   • Current watchlist: ${currentMovies.length} movies`);
  console.log(`   • Already watched: ${watchedCount} movies`);
  console.log('='.repeat(80) + '\n');

  if (activeSeason && currentMovies.length > 0) {
    console.log('💡 What happens when you reveal:');
    console.log('   1. Current watchlist cleared (movies → WATCHED)');
    console.log('   2. Pending picks revealed (movies → CURRENT)');
    console.log('   3. New watchlist ready to watch!\n');
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
