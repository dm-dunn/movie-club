import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  console.log('\n🎬 Fixing Pick Rounds for Classic Era vs Season 1\n');
  console.log('=' .repeat(80));

  // Season 1 movie titles
  const season1Titles = [
    'Boogie Nights',
    'Lars and the Real Girl',
    'Horns',
    'Psycho',
    'The Town',
    'The Shawshank Redemption',
    'Mystic River',
    'Frances Ha',
  ];

  console.log('📋 Season 1 Movies:');
  season1Titles.forEach((title) => console.log(`  - ${title}`));

  // Step 1: Update all movie picks to pickRound = 0 (Classic Era)
  console.log('\n📝 Setting all picks to Classic Era (pickRound = 0)...');
  const allPicksUpdate = await prisma.moviePick.updateMany({
    data: { pickRound: 0 },
  });
  console.log(`   ✓ Updated ${allPicksUpdate.count} picks to Classic Era`);

  // Step 2: Update Season 1 movies to pickRound = 1
  console.log('\n📝 Setting Season 1 movie picks to pickRound = 1...');
  let season1Count = 0;

  for (const title of season1Titles) {
    const movies = await prisma.movie.findMany({
      where: { title },
      select: { id: true },
    });

    for (const movie of movies) {
      const result = await prisma.moviePick.updateMany({
        where: { movieId: movie.id },
        data: { pickRound: 1 },
      });
      season1Count += result.count;
    }
  }

  console.log(`   ✓ Updated ${season1Count} picks to Season 1`);

  // Step 3: Verify the changes
  console.log('\n📊 Verification:');

  const classicEraPicks = await prisma.moviePick.count({
    where: { pickRound: 0 },
  });

  const season1Picks = await prisma.moviePick.count({
    where: { pickRound: 1 },
  });

  console.log(`   • Classic Era picks (pickRound = 0): ${classicEraPicks}`);
  console.log(`   • Season 1 picks (pickRound = 1): ${season1Picks}`);

  // Step 4: Show Season 1 picks by user
  console.log('\n🎬 Season 1 Picks by User:');
  console.log('-'.repeat(80));

  const season1PicksData = await prisma.moviePick.findMany({
    where: { pickRound: 1 },
    include: {
      user: {
        select: { name: true },
      },
      movie: {
        select: { title: true, year: true },
      },
    },
    orderBy: {
      user: { name: 'asc' },
    },
  });

  for (const pick of season1PicksData) {
    console.log(`  • ${pick.user.name} - ${pick.movie.title} (${pick.movie.year})`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Pick rounds updated successfully!\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
