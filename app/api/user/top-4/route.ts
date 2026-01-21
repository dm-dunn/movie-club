import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // TODO: Replace with actual authenticated user once auth is implemented
    const user = await prisma.user.findFirst({
      where: {
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No active users found" },
        { status: 404 }
      );
    }

    const rankings = await prisma.personalRanking.findMany({
      where: {
        userId: user.id,
        rank: {
          lte: 4, // Top 4 rankings
        },
      },
      include: {
        movie: {
          include: {
            moviePicks: {
              include: {
                user: {
                  select: {
                    name: true,
                    profilePictureUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        rank: "asc",
      },
    });

    // Transform data to match component expectations
    const transformedMovies = rankings.map((ranking) => ({
      id: ranking.movie.id,
      title: ranking.movie.title,
      posterUrl: ranking.movie.posterUrl,
      pickerName: ranking.movie.moviePicks[0]?.user.name || "Unknown",
      pickerProfilePicture:
        ranking.movie.moviePicks[0]?.user.profilePictureUrl || null,
    }));

    return NextResponse.json(transformedMovies);
  } catch (error) {
    console.error("Error fetching personal top 4:", error);
    return NextResponse.json(
      { error: "Failed to fetch personal top 4" },
      { status: 500 }
    );
  }
}
