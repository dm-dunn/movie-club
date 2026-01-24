import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get active season
    const activeSeason = await prisma.pickingSeason.findFirst({
      where: { isActive: true },
    });

    if (!activeSeason) {
      return NextResponse.json({
        status: "not_in_queue",
        position: null,
        seasonNumber: null,
        currentPicker: null,
        moviePick: null,
      });
    }

    // Get current picker details
    let currentPicker = null;
    if (activeSeason.currentPickerId) {
      const currentPickerUser = await prisma.user.findUnique({
        where: { id: activeSeason.currentPickerId },
        select: {
          id: true,
          name: true,
          profilePictureUrl: true,
        },
      });

      if (currentPickerUser) {
        currentPicker = currentPickerUser;
      }
    }

    // Check if user is in available pickers
    const userIndexInAvailable = activeSeason.availablePickerIds.indexOf(userId);
    const isInAvailable = userIndexInAvailable !== -1;

    // Check if user is in used pickers
    const isInUsed = activeSeason.usedPickerIds.includes(userId);

    // Get user's movie pick for the current season (most recent if multiple)
    let moviePick = null;
    const pick = await prisma.moviePick.findFirst({
      where: {
        userId: userId,
        pickRound: activeSeason.seasonNumber,
      },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            posterUrl: true,
            year: true,
          },
        },
      },
      orderBy: {
        pickedAt: 'desc',
      },
    });

    if (pick) {
      moviePick = pick.movie;
    }

    // Determine user's status
    let status: "current" | "next" | "upcoming" | "completed" | "not_in_queue";
    let position: number | null = null;

    // If user has a movie pick for this season, they've completed
    if (moviePick) {
      status = "completed";
    } else if (!isInAvailable && !isInUsed) {
      status = "not_in_queue";
    } else if (isInUsed) {
      status = "completed";
    } else if (isInAvailable) {
      // All users in availablePickerIds can pick simultaneously
      status = "current";
      position = userIndexInAvailable + 1;
    } else {
      status = "not_in_queue";
    }

    // User can change pick if they have picked AND they're still in availablePickerIds (not revealed yet)
    const canChangePick = moviePick !== null && isInAvailable;

    return NextResponse.json({
      status,
      position,
      seasonNumber: activeSeason.seasonNumber,
      currentPicker,
      moviePick,
      canChangePick,
    });
  } catch (error) {
    console.error("Error fetching picker status:", error);
    return NextResponse.json(
      { error: "Failed to fetch picker status" },
      { status: 500 }
    );
  }
}
