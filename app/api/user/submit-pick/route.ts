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

    // Verify user is current picker
    const currentPicker = await prisma.pickerQueue.findFirst({
      where: {
        userId: userId,
        isCurrent: true,
        completedAt: null,
      },
    });

    if (!currentPicker) {
      return NextResponse.json(
        { error: "It's not your turn to pick" },
        { status: 403 }
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
        pickRound: currentPicker.roundNumber,
      },
    });

    // Mark current picker as completed
    await prisma.pickerQueue.update({
      where: { id: currentPicker.id },
      data: {
        isCurrent: false,
        completedAt: new Date(),
      },
    });

    // Find next picker in queue
    const nextPicker = await prisma.pickerQueue.findFirst({
      where: {
        roundNumber: currentPicker.roundNumber,
        position: currentPicker.position + 1,
        completedAt: null,
      },
    });

    if (nextPicker) {
      // Set next picker in same round as current
      await prisma.pickerQueue.update({
        where: { id: nextPicker.id },
        data: { isCurrent: true },
      });
    } else {
      // Look for first picker in next round
      const nextRoundPicker = await prisma.pickerQueue.findFirst({
        where: {
          roundNumber: currentPicker.roundNumber + 1,
          position: 1,
          completedAt: null,
        },
      });

      if (nextRoundPicker) {
        await prisma.pickerQueue.update({
          where: { id: nextRoundPicker.id },
          data: { isCurrent: true },
        });
      }
    }

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
