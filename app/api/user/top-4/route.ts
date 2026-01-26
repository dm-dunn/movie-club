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

    // Get user's top 4 rated movies (highest ratings)
    const topRatings = await prisma.rating.findMany({
      where: {
        userId: user.id,
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
        rating: "desc",
      },
      take: 4,
    });

    // Transform data to match component expectations
    const transformedMovies = topRatings.map((rating) => ({
      id: rating.movie.id,
      title: rating.movie.title,
      posterUrl: rating.movie.posterUrl,
      pickerName: rating.movie.moviePicks[0]?.user.name || "Unknown",
      pickerProfilePicture:
        rating.movie.moviePicks[0]?.user.profilePictureUrl || null,
      userRating: rating.rating,
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
