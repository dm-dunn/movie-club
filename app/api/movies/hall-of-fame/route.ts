import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const movies = await prisma.movie.findMany({
      where: {
        status: "WATCHED",
        averageRating: {
          not: null,
        },
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
      },
      orderBy: {
        averageRating: "desc",
      },
      take: 12, // Top 12 movies
    });

    // Transform data
    const transformedMovies = movies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.posterUrl,
      pickerName: movie.moviePicks[0]?.user.name || "Unknown",
      pickerProfilePicture:
        movie.moviePicks[0]?.user.profilePictureUrl || null,
      averageRating: Math.round(Number(movie.averageRating) * 10) / 10, // Round to 1 decimal
    }));

    return NextResponse.json(transformedMovies);
  } catch (error) {
    console.error("Error fetching hall of fame:", error);
    return NextResponse.json(
      { error: "Failed to fetch hall of fame" },
      { status: 500 }
    );
  }
}
