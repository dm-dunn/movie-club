import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const body = await request.json();
    const { tmdbId, title, year, posterUrl, backdropUrl, overview, runtimeMinutes } = body;

    // Get active season and verify user is in available pickers
    const activeSeason = await prisma.pickingSeason.findFirst({
      where: { isActive: true },
    });

    if (!activeSeason) {
      return NextResponse.json(
        { error: "No active picking season" },
        { status: 400 }
      );
    }

    // Check if user is in the available pickers array
    if (!activeSeason.availablePickerIds.includes(userId)) {
      return NextResponse.json(
        { error: "It's not your turn to pick" },
        { status: 403 }
      );
    }

    // Check if user has already picked for this season
    const existingPick = await prisma.moviePick.findFirst({
      where: {
        userId: userId,
        pickRound: activeSeason.seasonNumber,
      },
    });

    if (existingPick) {
      return NextResponse.json(
        { error: "You have already picked for this season" },
        { status: 400 }
      );
    }

    // Check if movie already exists
    let movie = await prisma.movie.findUnique({
      where: { tmdbId },
    });

    // If movie doesn't exist, create it
    if (!movie) {
      movie = await prisma.movie.create({
        data: {
          title,
          year,
          posterUrl,
          backdropUrl,
          overview,
          runtimeMinutes,
          tmdbId,
          status: "UNWATCHED",
        },
      });
    }

    // Create movie pick
    await prisma.moviePick.create({
      data: {
        movieId: movie.id,
        userId: userId,
        pickRound: activeSeason.seasonNumber,
      },
    });

    // Note: User stays in availablePickerIds array
    // Admin will manually move them to usedPickerIds when ready to reveal

    return NextResponse.json({
      success: true,
      movie: {
        id: movie.id,
        title: movie.title,
        posterUrl: movie.posterUrl,
      },
    });
  } catch (error) {
    console.error("Error submitting pick:", error);
    return NextResponse.json(
      { error: "Failed to submit pick" },
      { status: 500 }
    );
  }
}
