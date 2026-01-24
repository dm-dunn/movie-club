import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
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
      return NextResponse.json(
        { error: "No active picking season" },
        { status: 400 }
      );
    }

    // Check if user is in the available pickers array (not revealed yet)
    if (!activeSeason.availablePickerIds.includes(userId)) {
      return NextResponse.json(
        { error: "Cannot change pick after it has been revealed" },
        { status: 403 }
      );
    }

    // Find user's pick for this season
    const pick = await prisma.moviePick.findFirst({
      where: {
        userId: userId,
        pickRound: activeSeason.seasonNumber,
      },
      include: {
        movie: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        pickedAt: 'desc',
      },
    });

    if (!pick) {
      return NextResponse.json(
        { error: "No pick found for this season" },
        { status: 404 }
      );
    }

    // Delete the pick
    await prisma.moviePick.delete({
      where: { id: pick.id },
    });

    return NextResponse.json({
      success: true,
      message: `Your pick "${pick.movie.title}" has been removed. You can now pick a new movie.`,
    });
  } catch (error) {
    console.error("Error deleting pick:", error);
    return NextResponse.json(
      { error: "Failed to delete pick" },
      { status: 500 }
    );
  }
}
