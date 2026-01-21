import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const movies = await prisma.movie.findMany({
      where: {
        status: "WATCHED",
      },
      include: {
        ratings: true,
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
    });

    // Calculate average ratings and transform data
    const transformedMovies = movies
      .map((movie) => {
        const totalRating = movie.ratings.reduce(
          (sum, rating) => sum + Number(rating.rating),
          0
        );
        const averageRating =
          movie.ratings.length > 0 ? totalRating / movie.ratings.length : 0;

        return {
          id: movie.id,
          title: movie.title,
          posterUrl: movie.posterUrl,
          pickerName: movie.moviePicks[0]?.user.name || "Unknown",
          pickerProfilePicture:
            movie.moviePicks[0]?.user.profilePictureUrl || null,
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        };
      })
      .filter((movie) => movie.averageRating > 0) // Only include rated movies
      .sort((a, b) => b.averageRating - a.averageRating) // Sort by rating descending
      .slice(0, 12); // Top 12 movies

    return NextResponse.json(transformedMovies);
  } catch (error) {
    console.error("Error fetching hall of fame:", error);
    return NextResponse.json(
      { error: "Failed to fetch hall of fame" },
      { status: 500 }
    );
  }
}
