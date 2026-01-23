import { prisma } from '../lib/prisma';

async function main() {
  console.log('\n🎬 Adding Movie Picks for Users\n');
  console.log('=' .repeat(80));

  const userPicks = [
    { name: 'Dalton', movieTitle: 'Frances Ha' },
    { name: 'Liam', movieTitle: 'Mystic River' },
    { name: 'Cam', movieTitle: 'The Shawshank Redemption' },
    { name: 'Rhett', movieTitle: 'Boogie Nights' },
    { name: 'Hailey', movieTitle: 'Lars and the Real Girl' },
    { name: 'Alex', movieTitle: 'Horns' },
  ];

  for (const pick of userPicks) {
    // Find the user by name using raw SQL
    const users = await prisma.$queryRaw<any[]>`
      SELECT * FROM users WHERE name = ${pick.name} LIMIT 1
    `;
    const user = users[0];

    if (!user) {
      console.log(`✗ User not found: ${pick.name}`);
      continue;
    }

    // Find the movie by title (case insensitive) using raw SQL
    const movies = await prisma.$queryRaw<any[]>`
      SELECT * FROM movies WHERE LOWER(title) = LOWER(${pick.movieTitle}) LIMIT 1
    `;
    const movie = movies[0];

    if (!movie) {
      console.log(`✗ Movie not found: ${pick.movieTitle}`);
      continue;
    }

    // Check if a pick already exists for this movie
    const existingPicks = await prisma.$queryRaw<any[]>`
      SELECT * FROM movie_picks WHERE movie_id = ${movie.id} LIMIT 1
    `;

    if (existingPicks.length > 0) {
      console.log(`⚠ Movie already picked: ${pick.movieTitle} (skipping)`);
      continue;
    }

    // Get the current round number (highest round + 1, or 1 if no picks exist)
    const lastPicks = await prisma.$queryRaw<any[]>`
      SELECT pick_round FROM movie_picks ORDER BY pick_round DESC LIMIT 1
    `;
    const currentRound = lastPicks.length > 0 ? lastPicks[0].pick_round : 1;

    // Create the movie pick using raw SQL
    await prisma.$executeRaw`
      INSERT INTO movie_picks (id, movie_id, user_id, pick_round, picked_at)
      VALUES (gen_random_uuid(), ${movie.id}, ${user.id}, ${currentRound}, NOW())
    `;

    console.log(`✓ Added pick: ${pick.name} -> ${pick.movieTitle} (Round ${currentRound})`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ User picks added successfully!\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
