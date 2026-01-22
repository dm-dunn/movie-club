import { PrismaClient, MovieStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('\n🎬 Set Current Movie\n');
    console.log('Usage:');
    console.log('  npm run db:set-current <movie-id>           # Set a movie as CURRENT');
    console.log('  npm run db:set-current <movie-id> watched   # Mark a movie as WATCHED');
    console.log('  npm run db:set-current clear                # Clear all CURRENT movies\n');

    // Show available movies
    console.log('Available movies:\n');
    const movies = await prisma.movie.findMany({
      include: {
        moviePicks: {
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
        { title: 'asc' },
      ],
    });

    movies.forEach((movie) => {
      const picker = movie.moviePicks[0];
      const statusEmoji = movie.status === 'WATCHED' ? '✅' : movie.status === 'CURRENT' ? '▶️' : '⏸️';
      console.log(`${statusEmoji} [${movie.status.padEnd(10)}] ${movie.title} (${movie.year || 'N/A'})`);
      console.log(`   ID: ${movie.id}`);
      console.log(`   Picked by: ${picker ? picker.user.name : 'Unknown'}\n`);
    });

    process.exit(0);
  }

  const movieIdOrCommand = args[0];
  const action = args[1]; // 'watched' or undefined

  // Handle 'clear' command
  if (movieIdOrCommand === 'clear') {
    const result = await prisma.movie.updateMany({
      where: {
        status: 'CURRENT',
      },
      data: {
        status: 'UNWATCHED',
      },
    });

    console.log(`\n✅ Cleared ${result.count} CURRENT movie(s)\n`);
    process.exit(0);
  }

  // Find the movie
  const movie = await prisma.movie.findUnique({
    where: {
      id: movieIdOrCommand,
    },
    include: {
      moviePicks: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!movie) {
    console.error(`\n❌ Movie not found with ID: ${movieIdOrCommand}\n`);
    process.exit(1);
  }

  // Determine the target status
  let targetStatus: MovieStatus;
  let successMessage: string;

  if (action === 'watched') {
    targetStatus = 'WATCHED';
    successMessage = `✅ Marked "${movie.title}" as WATCHED`;

    // Update movie with watched date
    await prisma.movie.update({
      where: {
        id: movieIdOrCommand,
      },
      data: {
        status: targetStatus,
        watchedDate: new Date(),
      },
    });
  } else {
    targetStatus = 'CURRENT';
    successMessage = `✅ Set "${movie.title}" as CURRENT movie`;

    // First, clear any other CURRENT movies
    await prisma.movie.updateMany({
      where: {
        status: 'CURRENT',
      },
      data: {
        status: 'UNWATCHED',
      },
    });

    // Then set this movie as CURRENT
    await prisma.movie.update({
      where: {
        id: movieIdOrCommand,
      },
      data: {
        status: targetStatus,
      },
    });
  }

  const picker = movie.moviePicks[0];
  console.log(`\n${successMessage}`);
  console.log(`Title: ${movie.title} (${movie.year || 'N/A'})`);
  console.log(`Picked by: ${picker ? picker.user.name : 'Unknown'}`);
  console.log(`Round: ${picker?.pickRound || 'N/A'}\n`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
