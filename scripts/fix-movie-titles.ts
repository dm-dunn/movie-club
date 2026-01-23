import { prisma } from '../lib/prisma';

async function main() {
  console.log('\n🎬 Fixing Movie Titles\n');
  console.log('=' .repeat(80));

  const moviesToFix = [
    { oldTitle: 'Suckerpunch (2011)', newTitle: 'Sucker Punch', year: 2011 },
    { oldTitle: 'My Life (1993)', newTitle: 'My Life', year: 1993 },
    { oldTitle: 'Malcolm X (1992)', newTitle: 'Malcolm X', year: 1992 },
    { oldTitle: 'Kicking and Screaming (1995)', newTitle: 'Kicking and Screaming', year: 1995 },
  ];

  for (const movie of moviesToFix) {
    // Try to find the movie with the old title
    const existingMovie = await prisma.movie.findFirst({
      where: {
        title: {
          contains: movie.oldTitle.split('(')[0].trim(),
          mode: 'insensitive',
        },
      },
    });

    if (existingMovie) {
      console.log(`\nFound: ${existingMovie.title}`);

      // Update the title and year
      await prisma.movie.update({
        where: { id: existingMovie.id },
        data: {
          title: movie.newTitle,
          year: movie.year,
        },
      });

      console.log(`✓ Updated: ${existingMovie.title} -> ${movie.newTitle} (${movie.year})`);
    } else {
      console.log(`\n✗ Not found: ${movie.oldTitle}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Movie titles fixed successfully!\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
