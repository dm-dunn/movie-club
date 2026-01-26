import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchCreditsForMovie, delay } from "@/lib/tmdb-credits";
import { updateGroupStats } from "@/lib/group-stats";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get active season
    const activeSeason = await prisma.pickingSeason.findFirst({
      where: { isActive: true },
    });

    if (!activeSeason) {
      return NextResponse.json(
        { error: "No active season found" },
        { status: 400 }
      );
    }

    // Get all users in available pickers who have actually picked
    const usersWhoPicked: string[] = [];

    for (const userId of activeSeason.availablePickerIds) {
      const pick = await prisma.moviePick.findFirst({
        where: {
          userId: userId,
          pickRound: activeSeason.seasonNumber,
        },
      });

      if (pick) {
        usersWhoPicked.push(userId);
      }
    }

    // Step 1: Clear current watchlist - move CURRENT movies to WATCHED
    const currentMoviesCleared = await prisma.movie.updateMany({
      where: { status: "CURRENT" },
      data: { status: "WATCHED" },
    });

    // Step 2: Get newly picked movies and set them to CURRENT (new watchlist)
    const newlyPickedMovies = await prisma.moviePick.findMany({
      where: {
        userId: { in: usersWhoPicked },
        pickRound: activeSeason.seasonNumber,
      },
      select: { movieId: true },
    });

    const newlyPickedMovieIds = newlyPickedMovies.map((pick) => pick.movieId);

    const newMoviesAdded = await prisma.movie.updateMany({
      where: { id: { in: newlyPickedMovieIds } },
      data: { status: "CURRENT" },
    });

    // Step 3: Move users who picked from available to used
    const remainingAvailableIds = activeSeason.availablePickerIds.filter(
      (id) => !usersWhoPicked.includes(id)
    );
    const updatedUsedIds = [...activeSeason.usedPickerIds, ...usersWhoPicked];

    // Step 4: Update season
    await prisma.pickingSeason.update({
      where: { id: activeSeason.id },
      data: {
        availablePickerIds: remainingAvailableIds,
        usedPickerIds: updatedUsedIds,
        currentPickerId: remainingAvailableIds.length > 0 ? remainingAvailableIds[0] : null,
        completedAt: remainingAvailableIds.length === 0 ? new Date() : null,
      },
    });

    // Step 5: Fetch and store credits for movies that just became WATCHED
    // (the ones that were previously CURRENT)
    const previouslyCurrentMovies = await prisma.movie.findMany({
      where: {
        status: "WATCHED",
        tmdbId: { not: null },
        castMembers: { none: {} }, // Only fetch if no cast members yet
      },
      select: { id: true, tmdbId: true, title: true },
    });

    for (const movie of previouslyCurrentMovies) {
      if (!movie.tmdbId) continue;

      const credits = await fetchCreditsForMovie(movie.tmdbId);
      if (credits) {
        // Store cast members
        for (const cast of credits.cast) {
          await prisma.castMember.upsert({
            where: {
              movieId_tmdbPersonId: {
                movieId: movie.id,
                tmdbPersonId: cast.tmdbPersonId,
              },
            },
            update: {},
            create: {
              movieId: movie.id,
              tmdbPersonId: cast.tmdbPersonId,
              name: cast.name,
              gender: cast.gender,
              castOrder: cast.castOrder,
            },
          });
        }

        // Store directors
        for (const director of credits.directors) {
          await prisma.crewMember.upsert({
            where: {
              movieId_tmdbPersonId_job: {
                movieId: movie.id,
                tmdbPersonId: director.tmdbPersonId,
                job: "Director",
              },
            },
            update: {},
            create: {
              movieId: movie.id,
              tmdbPersonId: director.tmdbPersonId,
              name: director.name,
              job: "Director",
            },
          });
        }
      }

      await delay(350); // Rate limiting for TMDB API
    }

    // Step 6: Update group statistics
    await updateGroupStats();

    // Get details of users who picked
    const pickerDetails = await prisma.user.findMany({
      where: { id: { in: usersWhoPicked } },
      select: {
        id: true,
        name: true,
      },
    });

    // Get their movie picks
    const picks = await prisma.moviePick.findMany({
      where: {
        userId: { in: usersWhoPicked },
        pickRound: activeSeason.seasonNumber,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        movie: {
          select: {
            title: true,
            year: true,
          },
        },
      },
      orderBy: {
        pickedAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Revealed ${usersWhoPicked.length} picks`,
      watchlistCleared: currentMoviesCleared.count,
      newWatchlistAdded: newMoviesAdded.count,
      revealedPicks: picks.map((pick) => ({
        userName: pick.user.name,
        movieTitle: pick.movie.title,
        movieYear: pick.movie.year,
      })),
      remainingPickers: remainingAvailableIds.length,
    });
  } catch (error) {
    console.error("Error revealing picks:", error);
    return NextResponse.json(
      { error: "Failed to reveal picks" },
      { status: 500 }
    );
  }
}
