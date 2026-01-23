import { prisma } from '../lib/prisma';

async function main() {
  console.log('\n🎬 Movie Club Database - Movies List\n');
  console.log('=' .repeat(80));

  // Get all movies grouped by status
  const movies = await prisma.movie.findMany({
    include: {
      moviePicks: {
        include: {
          user: {
            select: {
              name: true,
              username: true,
            },
          },
        },
      },
      ratings: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: [
      { status: 'asc' },
      { watchedDate: 'desc' },
      { title: 'asc' },
    ],
  });

  // Group by status
  const watched = movies.filter((m) => m.status === 'WATCHED');
  const current = movies.filter((m) => m.status === 'CURRENT');
  const unwatched = movies.filter((m) => m.status === 'UNWATCHED');

  // Display WATCHED movies
  if (watched.length > 0) {
    console.log('\n📺 WATCHED MOVIES (' + watched.length + ')');
    console.log('-'.repeat(80));
    watched.forEach((movie) => {
      const picker = movie.moviePicks[0];
      const avgRating = movie.ratings.length > 0
        ? (movie.ratings.reduce((sum, r) => sum + Number(r.rating), 0) / movie.ratings.length).toFixed(2)
        : 'N/A';

      console.log(`\n${movie.title} (${movie.year || 'N/A'})`);
      console.log(`  ID: ${movie.id}`);
      console.log(`  Watched: ${movie.watchedDate ? new Date(movie.watchedDate).toLocaleDateString() : 'N/A'}`);
      console.log(`  Picked by: ${picker ? picker.user.name : 'Unknown'} (Round ${picker?.pickRound || 'N/A'})`);
      console.log(`  Average Rating: ${avgRating} (${movie.ratings.length} ratings)`);
      if (movie.academyWins > 0 || movie.academyNominations > 0) {
        console.log(`  🏆 Oscars: ${movie.academyWins} wins, ${movie.academyNominations} nominations`);
      }
    });
  }

  // Display CURRENT movies
  if (current.length > 0) {
    console.log('\n\n🎥 CURRENT MOVIES (' + current.length + ')');
    console.log('-'.repeat(80));
    current.forEach((movie) => {
      const picker = movie.moviePicks[0];
      const avgRating = movie.ratings.length > 0
        ? (movie.ratings.reduce((sum, r) => sum + Number(r.rating), 0) / movie.ratings.length).toFixed(2)
        : 'N/A';

      console.log(`\n${movie.title} (${movie.year || 'N/A'})`);
      console.log(`  ID: ${movie.id}`);
      console.log(`  Picked by: ${picker ? picker.user.name : 'Unknown'} (Round ${picker?.pickRound || 'N/A'})`);
      console.log(`  Average Rating: ${avgRating} (${movie.ratings.length} ratings)`);
      if (movie.academyWins > 0 || movie.academyNominations > 0) {
        console.log(`  🏆 Oscars: ${movie.academyWins} wins, ${movie.academyNominations} nominations`);
      }
    });
  }

  // Display UNWATCHED movies
  if (unwatched.length > 0) {
    console.log('\n\n📋 UNWATCHED MOVIES (' + unwatched.length + ')');
    console.log('-'.repeat(80));
    unwatched.forEach((movie) => {
      const picker = movie.moviePicks[0];

      console.log(`\n${movie.title} (${movie.year || 'N/A'})`);
      console.log(`  ID: ${movie.id}`);
      console.log(`  Picked by: ${picker ? picker.user.name : 'Unknown'} (Round ${picker?.pickRound || 'N/A'})`);
      if (movie.academyWins > 0 || movie.academyNominations > 0) {
        console.log(`  🏆 Oscars: ${movie.academyWins} wins, ${movie.academyNominations} nominations`);
      }
    });
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log(`📊 SUMMARY: ${movies.length} total movies`);
  console.log(`   • ${watched.length} watched`);
  console.log(`   • ${current.length} current`);
  console.log(`   • ${unwatched.length} unwatched`);
  console.log('='.repeat(80) + '\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
