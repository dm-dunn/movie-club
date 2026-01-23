import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  console.log('\n📊 Adding watchedBy column to production database\n');
  console.log('=' .repeat(80));

  try {
    // Check if column already exists
    const checkColumn = await prisma.$queryRaw<any[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'movies'
      AND column_name = 'watched_by'
    `;

    if (checkColumn.length > 0) {
      console.log('✓ watched_by column already exists');
    } else {
      console.log('⚠ watched_by column not found, adding it now...');

      // Add the column using raw SQL
      await prisma.$executeRaw`
        ALTER TABLE movies
        ADD COLUMN watched_by TEXT[] DEFAULT '{}'
      `;

      console.log('✓ Successfully added watched_by column');
    }

    // Populate watchedBy array based on existing ratings
    console.log('\n📝 Populating watchedBy array based on existing ratings...');

    const movies = await prisma.$queryRaw<any[]>`
      SELECT m.id, m.title, array_agg(DISTINCT r.user_id) as user_ids
      FROM movies m
      LEFT JOIN ratings r ON m.id = r.movie_id
      GROUP BY m.id, m.title
      HAVING COUNT(r.user_id) > 0
    `;

    let updatedCount = 0;

    for (const movie of movies) {
      if (movie.user_ids && movie.user_ids.length > 0) {
        // Filter out null values
        const userIds = movie.user_ids.filter((id: any) => id !== null);

        if (userIds.length > 0) {
          await prisma.$executeRaw`
            UPDATE movies
            SET watched_by = ${userIds}::TEXT[]
            WHERE id = ${movie.id}
          `;

          updatedCount++;
          console.log(`✓ ${movie.title}: ${userIds.length} users`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✅ Migration complete! Updated ${updatedCount} movies.\n`);
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
