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

    // Get all active users
    const activeUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    if (activeUsers.length === 0) {
      return NextResponse.json(
        { error: "No active users found" },
        { status: 400 }
      );
    }

    // Shuffle the user IDs using Fisher-Yates algorithm
    const shuffledUserIds = activeUsers.map((u) => u.id);
    for (let i = shuffledUserIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledUserIds[i], shuffledUserIds[j]] = [shuffledUserIds[j], shuffledUserIds[i]];
    }

    // Get the next 3 pickers
    const nextThreePickers = shuffledUserIds.slice(0, 3);
    const remainingPickers = shuffledUserIds.slice(3);

    // Mark current active season as completed
    await prisma.pickingSeason.updateMany({
      where: { isActive: true },
      data: {
        isActive: false,
        completedAt: new Date(),
      },
    });

    // Get the next season number
    const lastSeason = await prisma.pickingSeason.findFirst({
      orderBy: { seasonNumber: "desc" },
    });

    const nextSeasonNumber = (lastSeason?.seasonNumber ?? 0) + 1;

    // Create new season
    const newSeason = await prisma.pickingSeason.create({
      data: {
        seasonNumber: nextSeasonNumber,
        availablePickerIds: nextThreePickers,
        usedPickerIds: [],
        currentPickerId: nextThreePickers[0],
        isActive: true,
      },
    });

    // Get user details for the next three pickers
    const nextPickersDetails = await prisma.user.findMany({
      where: { id: { in: nextThreePickers } },
      select: {
        id: true,
        name: true,
        profilePictureUrl: true,
      },
    });

    // Sort by the order in nextThreePickers array
    const sortedPickersDetails = nextThreePickers.map((id) =>
      nextPickersDetails.find((p) => p.id === id)
    );

    return NextResponse.json({
      success: true,
      season: {
        seasonNumber: newSeason.seasonNumber,
        nextThreePickers: sortedPickersDetails,
        totalUsers: shuffledUserIds.length,
        remainingInPool: remainingPickers.length,
      },
    });
  } catch (error) {
    console.error("Error resetting season:", error);
    return NextResponse.json(
      { error: "Failed to reset season" },
      { status: 500 }
    );
  }
}
