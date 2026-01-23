import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  console.log('\n📊 Checking Picking Season Status\n');
  console.log('=' .repeat(80));

  const activeSeason = await prisma.pickingSeason.findFirst({
    where: { isActive: true },
  });

  if (!activeSeason) {
    console.log('❌ No active season found');
    console.log('\nRun: npm run script scripts/initialize-season.ts');
    console.log('Or use the admin API: POST /api/admin/season/reset');
    console.log('\n' + '='.repeat(80));
    return;
  }

  console.log(`Season Number: ${activeSeason.seasonNumber}`);
  console.log(`Created: ${activeSeason.createdAt.toLocaleString()}`);
  console.log(`Status: ${activeSeason.completedAt ? '✓ Completed' : '▶ Active'}`);

  // Get current picker
  if (activeSeason.currentPickerId) {
    const currentPicker = await prisma.user.findUnique({
      where: { id: activeSeason.currentPickerId },
      select: { name: true },
    });
    console.log(`\n▶ Current Picker: ${currentPicker?.name}`);
  }

  // Get available pickers
  console.log('\n📋 Available Pickers (in order):');
  for (let i = 0; i < activeSeason.availablePickerIds.length; i++) {
    const user = await prisma.user.findUnique({
      where: { id: activeSeason.availablePickerIds[i] },
      select: { name: true },
    });
    const marker = i === 0 ? '▶' : ' ';
    console.log(`  ${marker} ${i + 1}. ${user?.name}`);
  }

  if (activeSeason.availablePickerIds.length === 0) {
    console.log('  (None - season complete!)');
  }

  // Get used pickers
  console.log('\n✅ Completed Pickers:');
  for (let i = 0; i < activeSeason.usedPickerIds.length; i++) {
    const user = await prisma.user.findUnique({
      where: { id: activeSeason.usedPickerIds[i] },
      select: { name: true },
    });

    // Get their movie pick
    const pick = await prisma.moviePick.findFirst({
      where: {
        userId: activeSeason.usedPickerIds[i],
        pickRound: activeSeason.seasonNumber,
      },
      include: {
        movie: {
          select: { title: true },
        },
      },
    });

    console.log(`  ${i + 1}. ${user?.name} - ${pick?.movie.title ?? 'No movie found'}`);
  }

  if (activeSeason.usedPickerIds.length === 0) {
    console.log('  (None yet)');
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
