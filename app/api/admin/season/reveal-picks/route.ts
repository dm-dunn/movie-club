import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Move users who picked from available to used
    const remainingAvailableIds = activeSeason.availablePickerIds.filter(
      (id) => !usersWhoPicked.includes(id)
    );
    const updatedUsedIds = [...activeSeason.usedPickerIds, ...usersWhoPicked];

    // Update season
    await prisma.pickingSeason.update({
      where: { id: activeSeason.id },
      data: {
        availablePickerIds: remainingAvailableIds,
        usedPickerIds: updatedUsedIds,
        currentPickerId: remainingAvailableIds.length > 0 ? remainingAvailableIds[0] : null,
        completedAt: remainingAvailableIds.length === 0 ? new Date() : null,
      },
    });

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
