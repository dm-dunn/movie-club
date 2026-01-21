import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = { id: session.user.id };

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
