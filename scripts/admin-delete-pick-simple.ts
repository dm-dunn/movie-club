import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('\n🗑️  Admin: Delete User Pick\n');
    console.log('Usage: npx tsx scripts/admin-delete-pick-simple.ts <username>');
    console.log('Example: npx tsx scripts/admin-delete-pick-simple.ts Alexis\n');

    // Show all picks in current season
    const activeSeason = await prisma.pickingSeason.findFirst({
      where: { isActive: true },
    });

    if (activeSeason) {
      const picks = await prisma.moviePick.findMany({
        where: { pickRound: activeSeason.seasonNumber },
        include: {
          user: { select: { name: true } },
          movie: { select: { title: true, year: true } },
        },
        orderBy: { user: { name: 'asc' } },
      });

      if (picks.length > 0) {
        console.log('📋 Current season picks:');
        picks.forEach((pick) => {
          console.log(`   • ${pick.user.name} - ${pick.movie.title} (${pick.movie.year})`);
        });
        console.log('');
      }
    }

    return;
  }

  const username = args[0];

  console.log('\n🗑️  Admin: Delete User Pick\n');
  console.log('=' .repeat(80));

  // Get active season
  const activeSeason = await prisma.pickingSeason.findFirst({
    where: { isActive: true },
  });

  if (!activeSeason) {
    console.log('❌ No active season found');
    return;
  }

  console.log(`Current Season: ${activeSeason.seasonNumber}`);

  // Find user
  const user = await prisma.user.findFirst({
    where: { name: { equals: username, mode: 'insensitive' } },
  });

  if (!user) {
    console.log(`❌ User "${username}" not found`);
    return;
  }

  console.log(`User: ${user.name}\n`);

  // Find their pick for this season
  const pick = await prisma.moviePick.findFirst({
    where: {
      userId: user.id,
      pickRound: activeSeason.seasonNumber,
    },
    include: {
      movie: {
        select: {
          id: true,
          title: true,
          year: true,
        },
      },
    },
    orderBy: {
      pickedAt: 'desc',
    },
  });

  if (!pick) {
    console.log(`❌ No pick found for ${user.name} in Season ${activeSeason.seasonNumber}`);
    return;
  }

  console.log('📋 Found pick:');
  console.log(`   Movie: ${pick.movie.title} (${pick.movie.year})`);
  console.log(`   Picked at: ${pick.pickedAt.toLocaleString()}`);

  // Delete the pick
  console.log('\n🗑️  Deleting pick...');
  await prisma.moviePick.delete({
    where: { id: pick.id },
  });

  console.log('✅ Pick deleted successfully!');
  console.log(`\n${user.name} can now pick again for Season ${activeSeason.seasonNumber}`);

  // Check if the movie should be deleted
  const movieUsage = await prisma.movie.findUnique({
    where: { id: pick.movie.id },
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
      console.log('\n💡 Movie has no other picks, ratings, or rankings.');
      console.log('   You can delete it with:');
      console.log(`   npx tsx -e "import prisma from './lib/prisma'; await prisma.movie.delete({where:{id:'${pick.movie.id}'}});await prisma.$disconnect()"`);
    } else {
      console.log('\n💡 Movie has other uses (picks, ratings, or rankings) - keeping it in database.');
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
