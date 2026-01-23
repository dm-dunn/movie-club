import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  console.log('\n🎬 Categorizing Movies into Viewing Seasons\n');
  console.log('=' .repeat(80));

  // Season 1 movies (as specified by user)
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

  console.log('\n📋 Season 1 Movies:');
  season1Titles.forEach((title) => console.log(`  - ${title}`));

  // Update Season 1 movies
  let season1Count = 0;
  for (const title of season1Titles) {
    const result = await prisma.movie.updateMany({
      where: { title },
      data: { viewingSeason: 'Season 1' },
    });
    season1Count += result.count;
  }

  console.log(`\n✅ Updated ${season1Count} movies to "Season 1"`);

  // Update all other movies to "Classic Era"
  const classicEraResult = await prisma.movie.updateMany({
    where: {
      viewingSeason: null,
    },
    data: { viewingSeason: 'Classic Era' },
  });

  console.log(`✅ Updated ${classicEraResult.count} movies to "Classic Era"`);

  // Show summary
  console.log('\n📊 Summary by Viewing Season:\n');

  const seasons = await prisma.movie.groupBy({
    by: ['viewingSeason'],
    _count: true,
  });

  for (const season of seasons) {
    console.log(`  ${season.viewingSeason || 'Uncategorized'}: ${season._count} movies`);
  }

  // List Classic Era movies
  console.log('\n\n🎭 Classic Era Movies:\n');
  const classicMovies = await prisma.movie.findMany({
    where: { viewingSeason: 'Classic Era' },
    orderBy: { title: 'asc' },
    select: {
      title: true,
      year: true,
      status: true,
    },
  });

  classicMovies.forEach((movie) => {
    const statusIcon = movie.status === 'WATCHED' ? '✓' : movie.status === 'CURRENT' ? '▶' : '○';
    console.log(`  ${statusIcon} ${movie.title} (${movie.year || 'N/A'})`);
  });

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
