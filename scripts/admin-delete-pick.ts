import 'dotenv/config';
import prisma from '../lib/prisma';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('\n🗑️  Admin: Delete User Pick\n');
  console.log('=' .repeat(80));

  // Get active season
  const activeSeason = await prisma.pickingSeason.findFirst({
    where: { isActive: true },
  });

  if (!activeSeason) {
    console.log('❌ No active season found');
    rl.close();
    return;
  }

  console.log(`Current Season: ${activeSeason.seasonNumber}\n`);

  // Get all users with picks in the current season
  const picks = await prisma.moviePick.findMany({
    where: {
      pickRound: activeSeason.seasonNumber,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      movie: {
        select: {
          id: true,
          title: true,
          year: true,
        },
      },
    },
    orderBy: {
      user: { name: 'asc' },
    },
  });

  if (picks.length === 0) {
    console.log('❌ No picks found for this season');
    rl.close();
    return;
  }

  console.log('📋 Users with picks in this season:\n');
  picks.forEach((pick, index) => {
    console.log(`${index + 1}. ${pick.user.name} - ${pick.movie.title} (${pick.movie.year})`);
  });

  console.log('');

  // Ask which pick to delete
  const answer = await askQuestion('Enter the number of the pick to delete (or "cancel" to exit): ');

  if (answer.toLowerCase() === 'cancel') {
    console.log('\n❌ Cancelled');
    rl.close();
    return;
  }

  const selectedIndex = parseInt(answer) - 1;

  if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= picks.length) {
    console.log('\n❌ Invalid selection');
    rl.close();
    return;
  }

  const selectedPick = picks[selectedIndex];

  console.log(`\n⚠️  You are about to delete:`);
  console.log(`   User: ${selectedPick.user.name}`);
  console.log(`   Movie: ${selectedPick.movie.title} (${selectedPick.movie.year})`);
  console.log(`   Season: ${activeSeason.seasonNumber}`);

  const confirm = await askQuestion('\nAre you sure? Type "yes" to confirm: ');

  if (confirm.toLowerCase() !== 'yes') {
    console.log('\n❌ Cancelled');
    rl.close();
    return;
  }

  // Delete the pick
  await prisma.moviePick.delete({
    where: { id: selectedPick.id },
  });

  console.log('\n✅ Pick deleted successfully!');
  console.log(`\n${selectedPick.user.name} can now pick again for Season ${activeSeason.seasonNumber}`);

  // Check if the movie should be deleted (if it has no other picks or ratings)
  const movieUsage = await prisma.movie.findUnique({
    where: { id: selectedPick.movie.id },
    include: {
      moviePicks: true,
      ratings: true,
      personalRankings: true,
    },
  });

  if (movieUsage) {
    const hasOtherPicks = movieUsage.moviePicks.length > 0;
    const hasRatings = movieUsage.ratings.length > 0;
    const hasRankings = movieUsage.personalRankings.length > 0;

    if (!hasOtherPicks && !hasRatings && !hasRankings) {
      const deleteMovie = await askQuestion(
        '\n⚠️  This movie has no other picks, ratings, or rankings. Delete the movie too? (yes/no): '
      );

      if (deleteMovie.toLowerCase() === 'yes') {
        await prisma.movie.delete({
          where: { id: selectedPick.movie.id },
        });
        console.log(`\n✅ Movie "${selectedPick.movie.title}" also deleted from database`);
      }
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');
  rl.close();
}

main()
  .catch((e) => {
    console.error('Error:', e);
    rl.close();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
