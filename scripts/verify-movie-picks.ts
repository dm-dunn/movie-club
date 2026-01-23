import { prisma } from '../lib/prisma';

async function main() {
  console.log('\n🎬 Verifying Movie Picks\n');
  console.log('=' .repeat(80));

  const movieTitles = [
    'Frances Ha',
    'Mystic River',
    'The Shawshank Redemption',
    'Boogie Nights',
    'Lars and the Real Girl',
    'Horns',
  ];

  for (const title of movieTitles) {
    const picks = await prisma.$queryRaw<any[]>`
      SELECT
        m.title,
        u.name as picker_name,
        mp.pick_round,
        mp.picked_at
      FROM movie_picks mp
      JOIN movies m ON mp.movie_id = m.id
      JOIN users u ON mp.user_id = u.id
      WHERE LOWER(m.title) = LOWER(${title})
    `;

    if (picks.length > 0) {
      const pick = picks[0];
      console.log(`✓ ${pick.title}`);
      console.log(`  Picked by: ${pick.picker_name}`);
      console.log(`  Round: ${pick.pick_round}`);
      console.log(`  Date: ${new Date(pick.picked_at).toLocaleDateString()}\n`);
    } else {
      console.log(`✗ ${title} - No pick found\n`);
    }
  }

  console.log('='.repeat(80));
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
