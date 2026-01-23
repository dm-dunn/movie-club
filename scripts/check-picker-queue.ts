import { prisma } from '../lib/prisma';

async function main() {
  console.log('\n📊 Checking Picker Queue\n');
  console.log('=' .repeat(80));

  const queue = await prisma.$queryRaw<any[]>`
    SELECT
      pq.id,
      pq.round_number,
      pq.position,
      pq.is_current,
      pq.completed_at,
      u.name as user_name
    FROM picker_queue pq
    JOIN users u ON pq.user_id = u.id
    ORDER BY pq.round_number, pq.position
  `;

  console.log(`Found ${queue.length} queue entries:\n`);

  for (const entry of queue) {
    const status = entry.completed_at ? '✓ Completed' : entry.is_current ? '▶ Current' : '⏳ Pending';
    console.log(`${status} | Round ${entry.round_number}, Pos ${entry.position} | ${entry.user_name}`);
    if (entry.completed_at) {
      console.log(`         Completed: ${new Date(entry.completed_at).toLocaleString()}`);
    }
  }

  console.log('\n' + '='.repeat(80));

  // Check movie picks for the 6 users
  console.log('\n🎬 Movie Picks for Target Users:\n');

  const userNames = ['Dalton', 'Liam', 'Cam', 'Rhett', 'Hailey', 'Alex'];

  for (const name of userNames) {
    const picks = await prisma.$queryRaw<any[]>`
      SELECT
        m.title,
        mp.pick_round,
        mp.picked_at,
        u.name as picker_name
      FROM movie_picks mp
      JOIN movies m ON mp.movie_id = m.id
      JOIN users u ON mp.user_id = u.id
      WHERE u.name = ${name}
      ORDER BY mp.picked_at DESC
      LIMIT 1
    `;

    if (picks.length > 0) {
      console.log(`${name}: ${picks[0].title} (Round ${picks[0].pick_round})`);
    } else {
      console.log(`${name}: No picks found`);
    }
  }

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
