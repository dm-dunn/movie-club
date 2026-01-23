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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get current active season
    const currentSeason = await prisma.pickingSeason.findFirst({
      where: { isActive: true },
    });

    if (!currentSeason) {
      return NextResponse.json({
        hasActiveSeason: false,
        message: "No active season found. Please reset to create a new season.",
      });
    }

    // Get user details for available pickers
    const availablePickers = await prisma.user.findMany({
      where: { id: { in: currentSeason.availablePickerIds } },
      select: {
        id: true,
        name: true,
        profilePictureUrl: true,
      },
    });

    // Sort by the order in availablePickerIds array
    const sortedAvailablePickers = currentSeason.availablePickerIds.map((id) =>
      availablePickers.find((p) => p.id === id)
    );

    // Get user details for used pickers
    const usedPickers = await prisma.user.findMany({
      where: { id: { in: currentSeason.usedPickerIds } },
      select: {
        id: true,
        name: true,
        profilePictureUrl: true,
      },
    });

    // Sort by the order in usedPickerIds array
    const sortedUsedPickers = currentSeason.usedPickerIds.map((id) =>
      usedPickers.find((p) => p.id === id)
    );

    // Get current picker details
    let currentPicker = null;
    if (currentSeason.currentPickerId) {
      currentPicker = await prisma.user.findUnique({
        where: { id: currentSeason.currentPickerId },
        select: {
          id: true,
          name: true,
          profilePictureUrl: true,
        },
      });
    }

    return NextResponse.json({
      hasActiveSeason: true,
      season: {
        seasonNumber: currentSeason.seasonNumber,
        currentPicker,
        availablePickers: sortedAvailablePickers,
        usedPickers: sortedUsedPickers,
        isComplete: currentSeason.availablePickerIds.length === 0,
      },
    });
  } catch (error) {
    console.error("Error fetching season status:", error);
    return NextResponse.json(
      { error: "Failed to fetch season status" },
      { status: 500 }
    );
  }
}
