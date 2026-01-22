import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const movies = await prisma.movie.findMany({
      where: {
        status: "CURRENT",
      },
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
        ratings: userId
          ? {
              where: {
                userId: userId,
              },
            }
          : false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data to match component expectations
    const transformedMovies = movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.posterUrl,
      pickerName: movie.moviePicks[0]?.user.name || "Unknown",
      pickerProfilePicture: movie.moviePicks[0]?.user.profilePictureUrl || null,
      userHasRated: userId ? movie.ratings.length > 0 : false,
    }));

    return NextResponse.json(transformedMovies);
  } catch (error) {
    console.error("Error fetching current watchlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch current watchlist" },
      { status: 500 }
    );
  }
}
