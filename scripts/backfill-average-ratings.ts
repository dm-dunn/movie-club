import "dotenv/config";
import prisma from "../lib/prisma";

async function backfillAverageRatings() {
  console.log("Starting to backfill average ratings...");

  try {
    // Get all movies that have ratings
    const movies = await prisma.movie.findMany({
      include: {
        ratings: {
          select: {
            rating: true,
          },
        },
      },
    });

    console.log(`Found ${movies.length} movies to process`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const movie of movies) {
      if (movie.ratings.length > 0) {
        // Calculate average rating
        const sum = movie.ratings.reduce(
          (acc, r) => acc + Number(r.rating),
          0
        );
        const averageRating = sum / movie.ratings.length;

        // Update the movie with the calculated average
        await prisma.movie.update({
          where: { id: movie.id },
          data: { averageRating },
        });

        console.log(
          `✓ Updated "${movie.title}" - Average: ${averageRating.toFixed(2)} (${movie.ratings.length} ratings)`
        );
        updatedCount++;
      } else {
        console.log(`- Skipped "${movie.title}" - No ratings`);
        skippedCount++;
      }
    }

    console.log("\n=== Backfill Complete ===");
    console.log(`Updated: ${updatedCount} movies`);
    console.log(`Skipped: ${skippedCount} movies (no ratings)`);
  } catch (error) {
    console.error("Error during backfill:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backfillAverageRatings();
