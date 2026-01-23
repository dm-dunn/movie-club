import { prisma } from '../lib/prisma';

async function main() {
  console.log('\n🎬 Marking User Picks as Completed\n');
  console.log('=' .repeat(80));

  const userNames = ['Dalton', 'Liam', 'Cam', 'Rhett', 'Hailey', 'Alex'];

  for (const name of userNames) {
    // Find the user by name using raw SQL
    const users = await prisma.$queryRaw<any[]>`
      SELECT * FROM users WHERE name = ${name} LIMIT 1
    `;
    const user = users[0];

    if (!user) {
      console.log(`✗ User not found: ${name}`);
      continue;
    }

    // Find their movie pick
    const picks = await prisma.$queryRaw<any[]>`
      SELECT mp.*, m.title
      FROM movie_picks mp
      JOIN movies m ON mp.movie_id = m.id
      WHERE mp.user_id = ${user.id}
      ORDER BY mp.picked_at DESC
      LIMIT 1
    `;

    if (picks.length === 0) {
      console.log(`✗ No movie pick found for: ${name}`);
      continue;
    }

    const pick = picks[0];

    // Check if they have a picker queue entry
    const queueEntries = await prisma.$queryRaw<any[]>`
      SELECT * FROM picker_queue
      WHERE user_id = ${user.id}
      AND round_number = ${pick.pick_round}
      LIMIT 1
    `;

    if (queueEntries.length === 0) {
      console.log(`⚠ No queue entry found for ${name} in Round ${pick.pick_round}, creating one...`);

      // Find an available position in this round
      const existingPositions = await prisma.$queryRaw<any[]>`
        SELECT position FROM picker_queue
        WHERE round_number = ${pick.pick_round}
        ORDER BY position DESC
        LIMIT 1
      `;

      const nextPosition = existingPositions.length > 0 ? existingPositions[0].position + 1 : 1;

      // Create a queue entry and mark it as completed
      await prisma.$executeRaw`
        INSERT INTO picker_queue (id, user_id, position, round_number, is_current, completed_at)
        VALUES (gen_random_uuid(), ${user.id}, ${nextPosition}, ${pick.pick_round}, false, ${pick.picked_at})
      `;

      console.log(`✓ Created and marked completed: ${name} -> ${pick.title} (Position ${nextPosition})`);
    } else {
      const queueEntry = queueEntries[0];

      // Mark the queue entry as completed if it isn't already
      if (!queueEntry.completed_at) {
        await prisma.$executeRaw`
          UPDATE picker_queue
          SET completed_at = ${pick.picked_at}, is_current = false
          WHERE id = ${queueEntry.id}
        `;
        console.log(`✓ Marked completed: ${name} -> ${pick.title}`);
      } else {
        console.log(`✓ Already completed: ${name} -> ${pick.title}`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Picker queue updated successfully!\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
