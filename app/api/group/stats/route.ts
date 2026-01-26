import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const stats = await prisma.groupStats.findFirst({
      where: { id: "singleton" },
    });

    if (!stats) {
      // Return default empty stats if not yet calculated
      return NextResponse.json({
        totalMinutesWatched: 0,
        totalOscarNominations: 0,
        totalOscarWins: 0,
        mostNominationsMovieTitle: null,
        mostNominationsCount: 0,
        mostWinsMovieTitle: null,
        mostWinsCount: 0,
        mostWatchedActorName: null,
        mostWatchedActorCount: 0,
        mostWatchedActressName: null,
        mostWatchedActressCount: 0,
        mostWatchedDirectorName: null,
        mostWatchedDirectorCount: 0,
      });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching group stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch group stats" },
      { status: 500 }
    );
  }
}
