import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find current picker (isCurrent = true)
    const currentPicker = await prisma.pickerQueue.findFirst({
      where: { isCurrent: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    // Find this user's queue entry
    const userQueueEntry = await prisma.pickerQueue.findFirst({
      where: {
        userId: user.id,
        completedAt: null, // Only get active queue entries
      },
    });

    // If user has completed their pick, get their movie pick
    const completedPick = await prisma.pickerQueue.findFirst({
      where: {
        userId: user.id,
        completedAt: { not: null },
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    let moviePick = null;
    if (completedPick) {
      const pick = await prisma.moviePick.findFirst({
        where: {
          userId: user.id,
          pickRound: completedPick.roundNumber,
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
      });

      if (pick) {
        moviePick = pick.movie;
      }
    }

    // Determine user's status
    let status: "current" | "next" | "upcoming" | "completed" | "not_in_queue";
    let position: number | null = null;

    if (!userQueueEntry && !completedPick) {
      status = "not_in_queue";
    } else if (completedPick && !userQueueEntry) {
      status = "completed";
    } else if (userQueueEntry?.isCurrent) {
      status = "current";
      position = userQueueEntry.position;
    } else if (userQueueEntry && currentPicker) {
      // Check if user is in the same round and next position
      const isNextInRound =
        userQueueEntry.roundNumber === currentPicker.roundNumber &&
        userQueueEntry.position === currentPicker.position + 1;

      // Check if user is in the next round at position 1 and current picker is at position 3
      const isNextRound =
        userQueueEntry.roundNumber === currentPicker.roundNumber + 1 &&
        userQueueEntry.position === 1 &&
        currentPicker.position === 3;

      if (isNextInRound || isNextRound) {
        status = "next";
        position = userQueueEntry.position;
      } else {
        status = "upcoming";
        position = userQueueEntry.position;
      }
    } else {
      status = "upcoming";
      position = userQueueEntry?.position ?? null;
    }

    return NextResponse.json({
      status,
      position,
      roundNumber: userQueueEntry?.roundNumber ?? completedPick?.roundNumber ?? null,
      currentPicker: currentPicker
        ? {
            id: currentPicker.user.id,
            name: currentPicker.user.name,
            profilePictureUrl: currentPicker.user.profilePictureUrl,
          }
        : null,
      moviePick,
    });
  } catch (error) {
    console.error("Error fetching picker status:", error);
    return NextResponse.json(
      { error: "Failed to fetch picker status" },
      { status: 500 }
    );
  }
}
