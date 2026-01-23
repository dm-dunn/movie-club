import { prisma } from '../lib/prisma';

async function main() {
  console.log('\n📊 Adding watchedBy column to movies table\n');
  console.log('=' .repeat(80));

  try {
    // Add the column using raw SQL
    await prisma.$executeRaw`
      ALTER TABLE movies
      ADD COLUMN IF NOT EXISTS watched_by TEXT[] DEFAULT '{}'
    `;

    console.log('✓ Successfully added watched_by column');

    // Populate watchedBy array based on existing ratings
    console.log('\n📝 Populating watchedBy array based on existing ratings...');

    const movies = await prisma.movie.findMany({
      include: {
        ratings: {
          select: {
            userId: true,
          },
        },
      },
    });

    for (const movie of movies) {
      const userIds = movie.ratings.map(r => r.userId);

      if (userIds.length > 0) {
        await prisma.movie.update({
          where: { id: movie.id },
          data: {
            watchedBy: userIds,
          },
        });

        console.log(`✓ ${movie.title}: ${userIds.length} users`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ watchedBy column added and populated successfully!\n');
  } catch (error) {
    console.error('Error:', error);
    throw error;
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
